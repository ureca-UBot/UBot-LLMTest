param([string]$InputDeck,[string]$OutputDir,[string]$BoundsFile)
$ErrorActionPreference='Stop'
$app=New-Object -ComObject PowerPoint.Application
$before=$app.Presentations.Count
$pres=$null
try {
  $pres=$app.Presentations.Open($InputDeck,-1,0,0)
  $pres.Export($OutputDir,'PNG',1600,900)
  if($BoundsFile){
    $bounds=@()
    foreach($slide in $pres.Slides){foreach($shape in $slide.Shapes){
      if($shape.HasTextFrame -and $shape.TextFrame.HasText){$bounds += [pscustomobject]@{Slide=$slide.SlideIndex;Name=$shape.Name;Text=$shape.TextFrame.TextRange.Text;Width=$shape.Width;Height=$shape.Height;BoundHeight=$shape.TextFrame.TextRange.BoundHeight;BoundWidth=$shape.TextFrame.TextRange.BoundWidth}}
      if($shape.HasTable){for($r=1;$r -le $shape.Table.Rows.Count;$r++){for($c=1;$c -le $shape.Table.Columns.Count;$c++){$cell=$shape.Table.Cell($r,$c).Shape;$bounds += [pscustomobject]@{Slide=$slide.SlideIndex;Name=('table cell '+$r+','+$c);Text=$cell.TextFrame.TextRange.Text;Width=$cell.Width;Height=$cell.Height;BoundHeight=$cell.TextFrame.TextRange.BoundHeight;BoundWidth=$cell.TextFrame.TextRange.BoundWidth}}}}
    }}
    $bounds | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $BoundsFile -Encoding utf8
  }
  Write-Output ('Rendered '+$pres.Slides.Count+' slides')
} finally {
  if($pres){$pres.Close()}
  if($before -eq 0 -and $app.Presentations.Count -eq 0){$app.Quit()}
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app)|Out-Null
}
