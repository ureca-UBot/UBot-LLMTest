param([string]$InputDeck,[string]$OutputDir)
$ErrorActionPreference='Stop'
$app=New-Object -ComObject PowerPoint.Application
$pres=$null
try {
  $pres=$app.Presentations.Open($InputDeck,-1,0,0)
  $pres.Export($OutputDir,'PNG',1600,900)
  Write-Output ('Rendered '+$pres.Slides.Count+' slides to '+$OutputDir)
  $bounds=@()
  foreach($slide in $pres.Slides) {
    foreach($shape in $slide.Shapes) {
      if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
        $bounds += [pscustomobject]@{Slide=$slide.SlideIndex;Name=$shape.Name;Text=$shape.TextFrame.TextRange.Text;Width=$shape.Width;Height=$shape.Height;BoundHeight=$shape.TextFrame.TextRange.BoundHeight;BoundWidth=$shape.TextFrame.TextRange.BoundWidth}
      }
    }
  }
  $bounds | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path (Split-Path $OutputDir) 'text_bounds.json') -Encoding utf8
  $pres.Close()
} finally {
  if($app){$app.Quit();[System.Runtime.Interopservices.Marshal]::ReleaseComObject($app)|Out-Null}
}
