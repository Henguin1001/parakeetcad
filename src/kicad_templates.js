/*
Author: Henry Troutman (henguin1001)
*/
var cheerio = require('cheerio');

// extendable class to handle conversion
// to xml structure
var templates = [];
class Kicad_Template {
  constructor(node) {
    this.node = node;
    this.element = cheerio(`<${node.identifier}></${node.identifier}>`);
    this.identifier = "default";
  }
  static match_id(identifier){
    // The default template matches all
    return true;
  }
  render_args(){
    // By default it will store the arguments in JSON
    // Specific tags will define their own argument behavior
    if(this.node.args.length != 0){
      var flat_args = JSON.stringify(this.node.args.map(e=>e.value));
      this.element.attr('data-args',flat_args);
    }
  }
  render_attributes(){
    var element = this.element;
    this.node.attributes.forEach(e=>{
      if(e.type == "coordinate"){
        element.attr(`${e.key}-x`,e.value[0]);
        element.attr(`${e.key}-y`,e.value[1]);
      } else if(e.type == "list"){
        element.attr(e.key,e.value.join(','));
      } else {
        element.attr(e.key,e.value[0]);
      }
    });
  }
}
class Kicad_CommonTemplate extends Kicad_Template {
  constructor(node) {
    super(node);
    this.arg_names = [];
  }
  render_args(){
    var args = this.node.args;
    var element = this.element;
    this.arg_names.forEach((name,index)=>{
      element.attr(name,args[index].value);
    });
  }
  static match_id(identifier){
    return false;
  }
}

class Kicad_Module extends Kicad_CommonTemplate {
  constructor(node) {
    super(node);
    this.arg_names = ["id"];
  }
  static match_id(identifier){
    return identifier=="module";
  }
}
class Kicad_Pad extends Kicad_CommonTemplate {
  constructor(node) {
    super(node);
    this.arg_names = ["number","form","shape"];
  }
  static match_id(identifier){
    return identifier=="pad";
  }
}
class Kicad_Text extends Kicad_CommonTemplate {
  constructor(node) {
    super(node);
    this.arg_names = ["type","contents"];
  }
  static match_id(identifier){
    return identifier=="fp_text";
  }
}



templates.push(Kicad_Text);
templates.push(Kicad_Pad);
templates.push(Kicad_Module);
templates.push(Kicad_Template);

module.exports = templates;
