// main.js
var dragElement = null;

$(".part").attr("draggable", "true");

$(document.body).on("dragover", ".part", function(ev) {
  ev.originalEvent.preventDefault();
});

$(document.body).on("dragstart", ".part", function(ev) {
  dragElement = this;

  setTimeout(() => {
    this.classList.add("empty");
  }, 0);
});

$(document.body).on("dragend", ".part", function(ev) {
  this.classList.remove("empty");
  dragElement = null;
});


$(".ext").on("dragover", ".putclone", function(ev) {
  ev.originalEvent.preventDefault();
  const rect = dragElement.getBoundingClientRect();
  this.style.width = rect.width+"px";
  this.style.height = rect.height+"px";
});


$(".ext").on("drop", ".putclone", function(ev) {
  const div = document.createElement("div");
  div.classList.add("word", "part");
  div.innerHTML = dragElement.innerHTML;
  div.dataset.value = dragElement.dataset.value;
  div.draggable = true;

  ev.delegateTarget.insertBefore(div, ev.delegateTarget.lastChild);
});

$(".ext").on("dragleave", ".putclone", function(ev) {
  this.style = "";
});

$(".addNewExt").on("click", function(ev) {
  const div = document.createElement("div");
  div.innerHTML = `<div class="ext"><div class="putclone"></div></div>`;
  const body = $(".phrase.bigField .body")[0];
  body.insertBefore(div.childNodes[0], [...body.children].at(-1));
});

$(".removeNewExt").on("click", function(ev) {
  const body = $(".phrase.bigField .body")[0];
  if (body.children.length == 2) return;
  [...body.children].at(-2).remove();
});



$.ajax({
  type: "get",
  url: "/isStatic",
  contentType: "application/json",
  dataType: "json",
  success: function (data) {
    $.ajax({
      url: "/getALL",
      dataType: "json",
      success: function (data) {
        $(".wrds.bigField .list").html(
            data.wrds.map(({name, value})=>
              `<div class="element"><div class="part" data-value="${value}">${name}</div> <div class="trans">${value}</div></div>`
            )
          );
        $(".mods.bigField .list").html(
            data.mods.map(({name, value})=>
              `<div class="element"><div class="part" data-value="${name}">${value}</div> <div class="trans">${name.replace("_", " ")}</div></div>`
            )
          );
          $(".part").attr("draggable", "true");
      }
    });
    
    $.ajax({
      type: "post",
      url: "/getMOD",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({value: "mon"}),
      success: function (data) {
        // console.log(data);
      }
    });
  },
  error: async function(err) {
    const db = new TurtleDB({path: "./db/lang.turtle"});
    const all = await db.getALL();
    $(".wrds.bigField .list").html(
      all.wrds.map(({name, value})=>
        `<div class="element"><div class="part" data-value="${value}">${name}</div> <div class="trans">${value}</div></div>`
      )
    );
    $(".mods.bigField .list").html(
      all.mods.map(({name, value})=>
        `<div class="element"><div class="part" data-value="${name}">${value}</div> <div class="trans">${name.replace("_", " ")}</div></div>`
      )
    );
    $(".part").attr("draggable", "true");
  }
});


class TurtleDB {
  /**
   * 
   * @param {{path: string, autoload: boolean?}} param0 
   */
  constructor({path, autoload} = {autoload: false}) {
    this.path = path;
    this.autoload = autoload;

  }
  async parse() {
    const f_ = await fetch(this.path);
    this.data = await f_.text();
    this.data = this.data.split(/[\r\n;]/gm).filter(e=>e!="");
    this.data = this.data.map(line=>line.split(" "));

    this.parsedData = {};
    this.parsedData.mods = this.data.filter(e=>e[0].startsWith("@mod"));
    this.parsedData.mods = this.parsedData.mods.map(
      ([mod, name, value, model, desc])=>({name, value, model, desc: btoa(desc||"")})
      );
    
    this.parsedData.wrds = this.data.filter(e=>e[0].startsWith("@wrd"));
    this.parsedData.wrds = this.parsedData.wrds.map(
      ([mod, name, value, desc])=>({name, value, desc: btoa(desc||"")})
      );
    return this.parsedData;
  }

  applyMod(o) {
    if (this.parsedData.mods.includes(o)) {
      const index = this.parsedData.mods.indexOf(o);
      this.parsedData.mods[index] = o;
    } else {
      this.parsedData.mods.push(o);
    }
    this.saveDB();
    return {status: 200};
  }
  
  applyWrd(o) {
    if (this.parsedData.wrds.includes(o)) {
      const index = this.parsedData.wrds.indexOf(o);
      this.parsedData.wrds[index] = o;
    } else {
      this.parsedData.wrds.push(o);
    }
    this.saveDB();
    return {status: 200};
  }

  getMod({name, value}) {
    if (!!name) {
      return this.parsedData.mods.find(e=>e.name == name);
    } else 
    if (!!value) {
      return this.parsedData.mods.find(e=>e.value == value);
    }
    return undefined;
  }

  getWrd({name, value}) {
    if (!!name) {
      return this.parsedData.wrds.find(e=>e.name == name);
    } else 
    if (!!value) {
      return this.parsedData.wrds.find(e=>e.value == value);
    }
    return undefined;
  }

  async getALL() {
    return this.parse();
  }

  toString() {
    var mods, wrds, res;
    mods = this.parsedData.mods.map(({name, value, model, desc})=>["@mod", name, value, model, btos(desc) ]);
    wrds = this.parsedData.wrds.map(({name, value, model, desc})=>["@wrd", name, value, /* */  btos(desc) ]);
    res = [wrds.map(e=>e.join(" ")), mods.map(e=>e.join(" "))].join(";\n");
    return res;
  }

  applyModel({model, value, apply}) {
    const m = {
      "$": value,
      "%": apply,
      "_": " ",
      "+": ""
    }
    return model.replace(/[$%_+]/gm, (match) => m[match]);
  } 
}

