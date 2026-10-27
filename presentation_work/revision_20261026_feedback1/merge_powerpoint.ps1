param([string]$Source,[string]$Native,[string]$Output)
$ErrorActionPreference='Stop'
$app=New-Object -ComObject PowerPoint.Application
$before=$app.Presentations.Count
$pres=$null;$own=$null
try {
  $own=$app.Presentations.Open($Native,-1,0,0)
  $n=$own.Slides.Count
  $own.Close();$own=$null
  $pres=$app.Presentations.Open($Source,-1,0,0)
  $null=$pres.Slides.InsertFromFile($Native,8,1,6)
  $pres.Slides.Item(33).Delete()
  $null=$pres.Slides.InsertFromFile($Native,32,7,7)
  if($n -eq 8){
    $pres.Slides.Item(19).Delete()
    $null=$pres.Slides.InsertFromFile($Native,18,8,8)
  }
  foreach($slide in $pres.Slides){foreach($shape in $slide.Shapes){
    if($shape.HasTextFrame -and $shape.TextFrame.HasText -and $shape.Left -gt 950 -and $shape.Top -gt 520){
      $t=$shape.TextFrame.TextRange.Text.Trim()
      if($t -match '^\d{1,2}$'){$shape.TextFrame.TextRange.Text=$slide.SlideIndex.ToString('00')}
    }
  }}
  $pres.SaveAs($Output,24)
  Write-Output ('Merged '+$n+' authored pages; total '+$pres.Slides.Count)
} finally {
  if($own){$own.Close()}
  if($pres){$pres.Close()}
  if($before -eq 0 -and $app.Presentations.Count -eq 0){$app.Quit()}
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app)|Out-Null
}
