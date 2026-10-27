"""Merge native authored slides into a copy; preserve original parts and assets.
Insert 6 technical slides after source page 8; fill source page 27 scheduler;
fill source page 13 stores only when a real screenshot slide exists.
"""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
import posixpath as pp,json,hashlib,copy,re
DIR=Path(__file__).resolve().parent
SOURCE=Path(r'C:\Ureka\ureca_project2\발표\프로젝트_발표자료_통합_정리.pptx')
NATIVE=DIR/'output/authored_validated.pptx'
P='http://schemas.openxmlformats.org/presentationml/2006/main'
A='http://schemas.openxmlformats.org/drawingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PKG='http://schemas.openxmlformats.org/package/2006/relationships'
CT='http://schemas.openxmlformats.org/package/2006/content-types'
NS={'p':P,'a':A,'r':R}
def xml(b):return E.fromstring(b)
def dump(e):return E.tostring(e,xml_declaration=True,encoding='UTF-8',standalone=True)
def relpart(owner):return pp.join(pp.dirname(owner),'_rels',pp.basename(owner)+'.rels')
def target(owner,t):return t.lstrip('/') if t.startswith('/') else pp.normpath(pp.join(pp.dirname(owner),t))
with ZipFile(SOURCE) as z:out={n:z.read(n) for n in z.namelist()}
original=dict(out)
with ZipFile(NATIVE) as z:src={n:z.read(n) for n in z.namelist()}
pr=xml(src['ppt/presentation.xml']);rels=xml(src['ppt/_rels/presentation.xml.rels'])
rm={r.get('Id'):target('ppt/presentation.xml',r.get('Target')) for r in rels}
native_slides=[rm[e.get('{'+R+'}id')] for e in pr.find('{'+P+'}sldIdLst')]
assert len(native_slides) in [7,8]
closure=set();todo=list(native_slides)
while todo:
 owner=todo.pop()
 if owner in closure:continue
 assert owner in src,owner
 closure.add(owner)
 rp=relpart(owner)
 if rp in src:
  closure.add(rp)
  for r in xml(src[rp]):
   if r.get('TargetMode')!='External':todo.append(target(owner,r.get('Target')))
mapping={};counters={}
for old in sorted(n for n in closure if not n.endswith('.rels')):
    directory=pp.dirname(old);name=pp.basename(old)
    m=re.match(r'^(.*?)(\d+)(\.[^.]+)$',name)
    if m:
        prefix,_,suffix=m.groups();key=(directory,prefix,suffix)
        if key not in counters:
            nums=[]
            for n in original:
                if pp.dirname(n)!=directory:continue
                mm=re.fullmatch(re.escape(prefix)+r'(\d+)'+re.escape(suffix),pp.basename(n))
                if mm:nums.append(int(mm.group(1)))
            counters[key]=max(nums,default=0)
        counters[key]+=1;new=pp.join(directory,prefix+str(counters[key])+suffix)
    else:new=old if old not in original else pp.join(directory,'own_'+name)
    assert new not in mapping.values(),new
    mapping[old]=new
for old in closure:
    if old.endswith('.rels'):
        owner=pp.join(pp.dirname(pp.dirname(old)),pp.basename(old)[:-5])
        mapping[old]=relpart(mapping[owner])
for old,new in mapping.items():
 if old.endswith('.rels'):
  owner=pp.join(pp.dirname(pp.dirname(old)),pp.basename(old)[:-5])
  new_owner=mapping[owner]
  rel=xml(src[old])
  for r in rel:
   if r.get('TargetMode')!='External':r.set('Target',pp.relpath(mapping[target(owner,r.get('Target'))],pp.dirname(new_owner)))
  out[new]=dump(rel)
 else:out[new]=src[old]
content=xml(out['[Content_Types].xml']);native_ct=xml(src['[Content_Types].xml'])
defaults={x.get('Extension') for x in content if E.QName(x).localname=='Default'}
overrides={x.get('PartName') for x in content if E.QName(x).localname=='Override'}
for x in native_ct:
 if E.QName(x).localname=='Default' and x.get('Extension') not in defaults:
  content.append(copy.deepcopy(x));defaults.add(x.get('Extension'))
 elif E.QName(x).localname=='Override' and x.get('PartName').lstrip('/') in mapping:
  y=copy.deepcopy(x);y.set('PartName','/'+mapping[x.get('PartName').lstrip('/')]);content.append(y)
pres=xml(out['ppt/presentation.xml']);presrels=xml(out['ppt/_rels/presentation.xml.rels'])
def newrel(part,typ):
 rid='rIdOwn'+str(len(presrels)+1)
 e=E.SubElement(presrels,'{'+PKG+'}Relationship',Id=rid,Type=R+'/'+typ,Target=pp.relpath(part,'ppt'))
 return rid
masters=pres.find('{'+P+'}sldMasterIdLst')
for old in sorted(closure):
 if old.startswith('ppt/slideMasters/') and old.endswith('.xml'):
  rid=newrel(mapping[old],'slideMaster');mid=max(int(e.get('id')) for e in masters)+1
  E.SubElement(masters,'{'+P+'}sldMasterId',id=str(mid),attrib={'{'+R+'}id':rid})
native_notes=[x for x in closure if x.startswith('ppt/notesMasters/') and x.endswith('.xml')]
if native_notes:
 notes=pres.find('{'+P+'}notesMasterIdLst')
 if notes is None:
  notes=E.Element('{'+P+'}notesMasterIdLst');pres.insert(list(pres).index(masters)+1,notes)
 for old in sorted(native_notes):
  E.SubElement(notes,'{'+P+'}notesMasterId',attrib={'{'+R+'}id':newrel(mapping[old],'notesMaster')})
native_rids=[newrel(mapping[x],'slide') for x in native_slides]
sldlist=pres.find('{'+P+'}sldIdLst');oldlist=list(sldlist);assert len(oldlist)==28
newlist=[];sid=max(int(e.get('id')) for e in oldlist)+1
for logical,e in enumerate(oldlist,1):
 if logical==13 and len(native_slides)==8:
  e=copy.deepcopy(e);e.set('{'+R+'}id',native_rids[7])
 if logical==27:
  e=copy.deepcopy(e);e.set('{'+R+'}id',native_rids[6])
 newlist.append(e)
 if logical==8:
  for rid in native_rids[:6]:
   newlist.append(E.Element('{'+P+'}sldId',id=str(sid),attrib={'{'+R+'}id':rid}));sid+=1
sldlist[:]=newlist
relmap={r.get('Id'):target('ppt/presentation.xml',r.get('Target')) for r in presrels}
for n,e in enumerate(newlist,1):
 part=relmap[e.get('{'+R+'}id')];slide=xml(out[part]);changed=False
 for shape in slide.findall('.//p:sp',NS):
  texts=shape.findall('.//a:t',NS);combined=''.join(t.text or '' for t in texts).strip()
  x=shape.find('p:spPr/a:xfrm/a:off',NS)
  if combined.isdigit() and len(combined)<=2 and x is not None and int(x.get('x'))>12000000 and int(x.get('y'))>6800000:
   texts[0].text=f'{n:02d}'
   for t in texts[1:]:t.text=''
   changed=True
 if changed:out[part]=dump(slide)
out['ppt/presentation.xml']=dump(pres);out['ppt/_rels/presentation.xml.rels']=dump(presrels);out['[Content_Types].xml']=dump(content)
candidate=DIR/'integrated_candidate.pptx'
with ZipFile(candidate,'w',ZIP_DEFLATED) as z:
 for n,b in out.items():z.writestr(n,b)
report=dict(source=str(SOURCE),source_sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),native=str(NATIVE),native_slides=len(native_slides),integrated_slides=len(newlist),
 source_logical_pages_replaced=[27]+([13] if len(native_slides)==8 else []),inserted_pages=[9,10,11,12,13,14],
 store_capture_pending=len(native_slides)<8,
 changed_original_parts=[n for n in original if out[n]!=original[n]],
 original_media_unchanged=all(out[n]==b for n,b in original.items() if n.startswith('ppt/media/')))
(DIR/'merge_manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
