
var TrimmedPivotX = function(sprite)
{
    var ppX = sprite.sourceRect.x - sprite.pivotPoint.x;
    return "" + ppX;
};
TrimmedPivotX.filterName = "TrimmedPivotX";
Library.addFilter("TrimmedPivotX");


var TrimmedPivotY = function(sprite)
{
    var ppY = sprite.sourceRect.y - sprite.pivotPoint.y;
    return "" + ppY;
};
TrimmedPivotY.filterName = "TrimmedPivotY";
Library.addFilter("TrimmedPivotY");

var MotionName = function(sprites)
{
    if (!sprites || sprites.length == 0) return "motion";
    var sprite = sprites[0];
    return sprite.trimmedName.replace(/^\d*_*/, '').replace(/_*\d*$/, '');
}
MotionName.filterName = "MotionName";
Library.addFilter("MotionName");
