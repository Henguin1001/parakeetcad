/*
Author: Henry Troutman
*/
const GC = {
  comment:"04",
  mode:{
    absolute:"90",
    incremental:"91"
  },
  unit:{
    inch:"70",
    mm:"71"
  },
  tool:"54",
  interpolate:{
    linear:"01",
    circular:{
      cw:"02",
      ccw:"03"
    }
  }
};
const DC = {
  up:"02",
  down:"01",
  flash:"03"
};
const MC = {
  stop:"00",
  end:"02"
};
const COMMENT_HEADER = "G04 Layer: TopLayer*\nG04 EasyEDA v6.1.49, Sun, 02 Jun 2019 06:23:37 GMT*\nG04 66c5286db96e4661acc7c33619b52065,10*\nG04 Gerber Generator version 0.2*\nG04 Scale: 100 percent, Rotated: No, Reflected: No *\nG04 Dimensions in inches *\nG04 leading zeros omitted , absolute positions ,2 integer and 4 decimal *";

function extended_header (leading_trailing=0, absolute_incremental = 0, format_x = 24, format_y = 24){
  // Default: %FSLAX24Y24*%
  return `%FS${leading_trailing?'T':'L'}${absolute_incremental?'I':'A'}X${format_x}Y${format_y}*%`;
}
function extended_units (unit="in"){
  // Default: %MOIN*%
  return `%MO${unit.toUpperCase()}*%`;
}
function extended_polarity(pos_neg = 0){
  // Default: %IPPOS*%
  return `%IP${pos_neg?'NEG':'POS'}*%`
}
function extended_layer(dark_clear=0){
  return `%LP${dark_clear?'C':'D'}*%`;
}
function GD_Code(G, D){
  // G_D_*
  return `G${G}` + ((D!=undefined)? `D${D}*`: `*`);
}
function header(unit= "in", absolute_incremental = 0){
  return [
    GD_Code(absolute_incremental?GC.mode.incremental:GC.mode.absolute),
    GD_Code(unit=="in"?GC.unit.inch:GC.unit.mm, DC.up)
  ].join("\n");
}
function footer(){
  return `M${MC.stop}*\nM${MC.end}*`;
}

function toGerberConvention(number, leading_trailing=0){
  return (Number.parseFloat(number/1000).toFixed(4)).toString().split('.')[1];
}

class Aperture {
  constructor(code, circle_rectangle) {
    this.code = code;
    this.circle_rectangle = circle_rectangle;
    this.args = [...arguments].slice(2);
  }
  to_gerber(){
    return GD_Code(GC.tool,this.code);
  }
  extended(){
    return `%ADD${this.code}${this.circle_rectangle?'R':'C'},${this.args.join('X')}*%`;
  }
}
var wire = new Aperture(10,0,"0.010000");
var pad = new Aperture(11,0,"0.023622");

class Document {
  constructor(unit="in", absolute_incremental = 0,leading_trailing=0, format_x = 24, format_y = 24) {
    this.unit = unit;
    this.absolute_incremental = absolute_incremental;
    this.leading_trailing = leading_trailing;
    this.format_x = format_x;
    this.format_y = format_y;
    this.apertures = [];
    this.layers = [];
  }
  to_gerber(){
    return [
      COMMENT_HEADER,
      extended_header(this.leading_trailing, this.absolute_incremental, this.format_x, this.format_y),
      extended_units(this.unit),
      header(this.unit, this.absolute_incremental),
      this.apertures.map(aperture=>aperture.extended()).join('\n'),
      this.layers.map(layer=>layer.to_gerber()),

      footer()
    ].join('\n');
  }
}
class Layer {
  constructor(dark_clear=0) {
    this.dark_clear = dark_clear;
    this.operations = [];
    this.components = [];
  }
  set_tool(aperture){
    this.operations.push(aperture.to_gerber());
  }
  move_to(x,y){
    this.operations.push(`G${GC.interpolate.linear}X${toGerberConvention(x)}Y${toGerberConvention(y)}D${DC.up}*`);
  }
  draw_to(x,y){
    this.operations.push(`G${GC.interpolate.linear}X${toGerberConvention(x)}Y${toGerberConvention(y)}D${DC.down}*`);
  }
  flash_to(x,y){
    this.operations.push(`G${GC.interpolate.linear}X${toGerberConvention(x)}Y${toGerberConvention(y)}D${DC.flash}*`);
  }
  to_gerber(){
    this.components.forEach(component=>component.draw(this));
    return [
      extended_layer(this.dark_clear),
      this.operations.join('\n')
    ].join('\n');
  }
}
class Component {
  constructor() {}
  draw(layer){}
}
class SOIC extends Component {
  constructor(position=[0,0], pins=16){
    super();
    this.position = position;
    this.pins = pins;
    this.aperture = pad;
  }
  draw(layer){
    var hx = this.position[0],
      hy = this.position[1];
    layer.set_tool(this.aperture);
    for(var i = 0; i < Math.floor(this.pins/2);i++){
      var x = hx+i*50;
      layer.move_to(x,hy);
      layer.draw_to(x,hy-47.3);
    }
    hy = hy-2340;
    for(var i = 0; i < Math.floor(this.pins/2);i++){
      var x = hx+i*50;
      layer.move_to(x,hy);
      layer.draw_to(x,hy-47.3);
    }
  }
}

var doc = new Document();
doc.apertures.push(wire);
doc.apertures.push(pad);

var layer1 = new Layer();
doc.layers.push(layer1);

var SOIC_16 = new SOIC([100,100]);
var SOIC_8 = new SOIC([100,800],8);

layer1.components.push(SOIC_16);
layer1.components.push(SOIC_8);

// console.log(part1.draw(layer1));
console.log(doc.to_gerber());
