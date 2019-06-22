var cheerio = require('cheerio');
var fs = require('fs');
var parser = require('./littlelisp.js').littleLisp.parse;
var templates = require("./kicad_templates.js");

class Node {
  constructor(lisp_struct) {
    this.contents = lisp_struct;
    if(this.isLeaf){
      // if it is a leaf then it represents a key-value pair
      this.key = this.identifier;
      if(this.isCoordinate){
        // If it is a coordinate we want to store the two values
        // and indicate the type
        this.value = [this.contents[1].value, this.contents[2].value];
        this.type = "coordinate";
      } else {
        this.value = this.contents.slice(1).map(e=>e.value);
        if(this.contents.length > 2)
          this.type = "list"
        else this.type = this.contents[1].type;
      }
    }  else {
      // The element has descendents.
      // If a descendent is a leaf immediately attatched to the branch,
      // then the current branch stores its data.
      // If the descendent has its own children (a parent), then
      // the current branch has no further work to do
      var descendents = this.contents.filter(this.isParent)
        .map(parent=>(new Node(parent)));
      // These terms are named to match the XML terminology
      [this.children, this.attributes] = this.getAttributes(descendents);
      this.type = "parent";
    }
  }
  getAttributes(descendents){
    // Attributes are the leaves attatched to the current branch
    // Separate the leafs from the stems
    // returns [stems, leafs];
    return descendents.reduce((accumulator, element) => {
      accumulator[element.isLeaf].push(element);
      return accumulator;
    },[[], []]);
  }
  isParent(data){
    return Array.isArray(data);
  }
  isStrictlyPrimitive(data){
    return data.type == "number" || data.type == "string";
  }
  isPrimitive(data){
    return !Array.isArray(data);
  }
  get isLeaf(){
    // Check every item for children
    return this.contents.every(this.isPrimitive)?1:0;
  }
  get identifier(){
    // Find the first item with an identifier, get its value
    return this.contents.find(e=>e.type=='identifier').value;
  }
  get isCoordinate(){
    // Determines if the element is a coordinate
    // A coordinate has the form [Key, Number, Number]
    // First we check the length, then we ensure it is flat before
    // we check the types
    return this.contents.length==3
      && this.isLeaf
      && this.contents[0].type == 'identifier'
      && this.contents[1].type == 'number'
      && this.contents[2].type == 'number'
  }
  get args(){
    // We avoid using the word arguments because it could cause
    // weird or broken behaviour (it represents the current functions arguments)
    return this.contents.filter(this.isPrimitive).slice(1);
  }
  getDomElement(){
    var template_class = templates.find(t=>t.match_id(this.identifier));
    var template = new template_class(this);
    template.render_args();
    template.render_attributes();
    var dom = template.element;
    this.children.forEach(e=>dom.append(e.getDomElement()));
    return dom;
  }
}

class Kicad_Library {
  constructor(lisp_txt) {
    var lisp_json = parser(lisp_txt);
    var root_node = new Node(lisp_json);
    this.element = root_node.getDomElement();

    this.$ = cheerio.load('<library></library>',{xmlMode: true});
    this.$("library").append(this.element);
  }
  exportToFile(filename){
    fs.writeFileSync(filename,this.$.html());
  }
  exportToString(){
    return this.$.html();
  }
  get module_name(){
    return this.element.attr("id");
  }
}
module.exports = Kicad_Library;
