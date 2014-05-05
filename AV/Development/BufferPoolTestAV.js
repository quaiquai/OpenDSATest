"use strict";
(function ($) {
  var jsav,                 // jsav
      buffer_size = 0,      // number of elements in buffer pool
      pool,                 // array holding jsav array (for buffers)
      list,                 // jsav array for list representation
      memory,               // jsav array for disk
      lines,                // array holding jsav lines
      LRU_moveup = 0,
      LRU_moveup_kai = 0,    
      LRU_replace = 0,
      empty_index = 0,
      into_list = 0,
      LFU_index = 0;

  var lines_end = [];
  var LFU_counter = [];
  var label_array = [];
  // check if one of the buffers contains the sector
  // returns index if value is found
  function contains(val) {
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].value(0) == val) {
        return i;
      }
    }
    return -1;
  }
  // cheks the list for matching secotr
  // return index if value is found
  function contains_kai(val) {
    for (var i = 0; i < buffer_size; i++) {
      if (list.value(i) == val) {
        return i;
      }
    }
    return -1;
  }
  // unhighlight every buffer
  function unhighlight_pool() {
    for (var i = 0; i < pool.length; i++) {
      pool[i].unhighlight();
    }
  }
  // display counters for LFU
  function show_counters() {
    for (var i = 0; i < buffer_size; i++) {
      if (list.value(i) != "") {
        label_array[i] = jsav.label(LFU_counter[list.value(i)], {"top": 40 + i * 45, "left": 700});
      }
    }
  }
  function hide_counters() {
    for (var i = 0; i < label_array.length; i++) {
      label_array[i].hide();
    }
  }
  // initalize the visualization
  function initialize() {
    //console.log("initialize");
    jsav = new JSAV($('.avcontainer'));
    jsav.recorded();
    jsav.displayInit();
    var empty = [];
    pool = [];
    lines = [];

    lines_end[0] = 43;
    lines_end[1] = 88;
    lines_end[2] = 137;
    lines_end[3] = 180;
    lines_end[4] = 227;

    list = jsav.ds.array(empty);
    memory = jsav.ds.array(empty);
    update();
  }
  // when next button is clicked
  function next() {
    //console.log("size: " + buffer_size);
    var input = $("#input").val();
    var replacement = $("#function").val();
    //console.log("replacement " + replacement);
    if (replacement == 1) {
      LRU(input);
    }
    if (replacement == 2) {
      FIFO(input);
    }
    if (replacement == 3) {
      LFU(input);
    }
  }

  function drawlines() {
    for (var i = 0; i < pool.length; i++) {
      var endpoint = contains_kai(pool[i].value(0));
      if (pool[i].value(0) != "") {
        lines[i] = jsav.g.line(445,  43 + 75 * i, 550,  lines_end[endpoint], {'stroke-width' : 2});
      }
    }
  }

  function clearlines() {
    for (var i = 0; i < lines.length; i++) {
      lines[i].hide();
    }
  }

  function LRU(input) {
    clearlines();
    //console.log("LRU");
    if (contains_kai(input) != -1 && LRU_replace == 0) {
      var index = contains_kai(input);
      if (LRU_moveup_kai == 0) {
        list.unhighlight();
        $("#input").attr("disabled", "disabled");
        jsav.umsg("a buffer already contains sector " + input);
        list.highlight(index);
        LRU_moveup_kai++;
      }
      else if (LRU_moveup_kai == 1) {
        var index = contains_kai(input);
        empty_index = index;
        jsav.umsg("the buffer containing secotr " + input + " will be moved to the front of the list");
        list.unhighlight();
        list.value(index, "");
        LRU_moveup_kai++;
      }
    }
    else if (LRU_moveup_kai == 2) {
      for (var i = empty_index-1; i > -1; i--) {
        jsav.effects.moveValue(list, i, list, i+1);
      }
      LRU_moveup_kai++;
    }
    else if (LRU_moveup_kai == 3) {
      jsav.umsg("Sector " + input + " moved to front of the list");
      list.value(0, input);
      list.highlight(0);
      LRU_moveup_kai = 0;
      $("#input").removeAttr("disabled");
    }
    else if (buffer_size < pool.length) {
      if (into_list == 0) {
        //console.log(buffer_size);
        list.unhighlight();
        memory.highlight(input);
        pool[buffer_size].highlight();
        jsav.umsg("a buffer stores sector " + input + " from storage");
        //jsav.effects.copyValue(memory, input, pool, buffer_size);
        pool[buffer_size].value(0, input);
        $("#input").attr("disabled", "disabled");
        into_list = 1;
      }
      else if (into_list == 1) {
        if (buffer_size == 0) {
          jsav.umsg("buffer is placed into a list");
          pool[buffer_size].unhighlight();
          list.highlight(0);
          list.value(0, input);
          buffer_size++;
          into_list = 0;
          $("#input").removeAttr("disabled");
        }
        else if (LRU_moveup == 0) {
          list.unhighlight();
          jsav.umsg("buffer is place into a list, the recently used buffer will move up in the list");
          pool[buffer_size].unhighlight();   
          list.value(buffer_size, input);
          list.highlight(buffer_size);
          LRU_moveup++;
        }
        else if (LRU_moveup == 1) {
          jsav.umsg("moving recently used buffer to front of the list");
          list.unhighlight();
          list.value(buffer_size, "");
          LRU_moveup++;
        }
        else if (LRU_moveup == 2) {
          jsav.umsg("moving recently used buffer to front of the list");
          list.unhighlight();
          for (var i = buffer_size-1; i > -1; i--) {
            jsav.effects.moveValue(list, i, list, i+1);
          }
          LRU_moveup++;
        }
        else if (LRU_moveup == 3) {
          jsav.umsg("most recently used buffer moved to front of the list");
          list.value(0, input);
          LRU_moveup = 0;
          into_list = 0;
          buffer_size++;
          list.highlight(0);
          $("#input").removeAttr("disabled");
        }
      }
    }
    else {
      if (into_list == 0) {
        list.unhighlight();
        jsav.umsg("buffer pool full, least recently used buffer will be replaced");
        list.highlight(buffer_size-1);
        var index = contains(list.value(buffer_size-1));
        console.log(index);
        pool[index].highlight();
        into_list = 1;
        $("#input").attr("disabled", "disabled");
      }
      else if (into_list == 1) {
        if (LRU_replace == 0) {
          jsav.umsg("contents of sector " + list.value(buffer_size-1) + " copied back to disk");
          $("#input").attr("disabled", "disabled");
          LRU_replace++;
        }
        else if (LRU_replace == 1) {
          list.unhighlight();
          empty_index = contains(list.value(buffer_size-1));
          pool[empty_index].unhighlight();
          memory.unhighlight(list.value(buffer_size-1));
          list.value(buffer_size-1, "");
          pool[empty_index].value(0, "");
          LRU_replace++;
        }
        else if (LRU_replace == 2) {
          jsav.umsg("contents of sector " + input + " copied into buffer pool");
          memory.highlight(input);
          list.highlight(buffer_size-1);
          pool[empty_index].highlight();
          pool[empty_index].value(0, input);
          list.value(buffer_size-1, input);
          LRU_replace++;
        }
        else if (LRU_replace == 3) {
          pool[empty_index].unhighlight();
          jsav.umsg("moving recently used buffer to front of the list");
          LRU_replace++;          
        }
        else if (LRU_replace == 4) {
          list.unhighlight();
          list.value(buffer_size-1, "");
          LRU_replace++;
        }
        else if (LRU_replace == 5) {
          for (var i = buffer_size-2; i > -1; i--) {
            jsav.effects.moveValue(list, i, list, i+1);
          }
          LRU_replace++;
        }
        else if (LRU_replace == 6) {
          jsav.umsg("most recently used buffer moved to front of the list");
          list.value(0, input);
          LRU_replace = 0;
          into_list = 0;
          list.highlight(0);
          $("#input").removeAttr("disabled");
        }
      }
    }
    drawlines();
  }

  function FIFO(input) {
    clearlines();
    unhighlight_pool();
    if (contains_kai(input) != -1) {
      jsav.umsg("sector " + input + " already in one of the buffers");
      list.unhighlight();
      list.highlight(contains_kai(input));
      pool[contains(input)].highlight();
    }
    else if (buffer_size < pool.length) {
      if (into_list == 0) {
        //console.log(buffer_size);
        list.unhighlight();
        memory.highlight(input);
        pool[buffer_size].highlight();
        jsav.umsg("a buffer stores sector " + input + " from storage");
        //jsav.effects.copyValue(memory, input, pool, buffer_size);
        pool[buffer_size].value(0, input);
        $("#input").attr("disabled", "disabled");
        into_list = 1;
      }
      else if (into_list == 1) {
        jsav.umsg("buffer is placed into a list");
        pool[buffer_size].unhighlight();
        list.unhighlight();
        for (var i = buffer_size-1; i > -1; i--) {
          jsav.effects.moveValue(list, i, list, i+1);
        }
        into_list++;
      }
      else if (into_list == 2) {
        console.log("2");
        list.highlight(0);
        list.value(0, input);
        $("#input").removeAttr("disabled");
        into_list = 0;
        buffer_size++;        
      }
    }
    else {
      if (into_list == 0) {
        jsav.umsg("buffer pool full, buffer at front of queue will be replaced");
        list.unhighlight();
        list.highlight(buffer_size-1);
        var index = contains(list.value(buffer_size-1));
        console.log(index);
        pool[index].highlight();
        into_list = 1;
        $("#input").attr("disabled", "disabled");
      }
      else if (into_list == 1) {
        jsav.umsg("contents of sector " + list.value(buffer_size-1) + " copied back to disk");
        $("#input").attr("disabled", "disabled");
        into_list++;
      }
      else if (into_list == 2) {
        list.unhighlight();
        empty_index = contains(list.value(buffer_size-1));
        pool[empty_index].unhighlight();
        memory.unhighlight(list.value(buffer_size-1));
        list.value(buffer_size-1, "");
        pool[empty_index].value(0, "");
        into_list++;        
      }
      else if (into_list == 3) {
        for (var i = buffer_size-2; i > -1; i--) {
          jsav.effects.moveValue(list, i, list, i+1);
        }
        into_list++;
      }
      else if (into_list == 4) {
        jsav.umsg("contents of sector " + input + " copied into buffer pool");
        memory.highlight(input);
        pool[empty_index].value(0, input);
        list.value(0, input);
        list.highlight(0);
        into_list = 0;
        $("#input").removeAttr("disabled");
      }
    }
    drawlines();
  }

  function LFU(input) {
    hide_counters();
    clearlines();
    unhighlight_pool();
    list.unhighlight();
    if (contains_kai(input) != -1) {
      jsav.umsg("a buffer already contains sector, incrementing counter");
      list.highlight(contains_kai(input));
      pool[contains_kai(input)].highlight();
      LFU_counter[input]++;
    }
    else if (buffer_size < pool.length) {
      if (into_list == 0) {
        //console.log(buffer_size);
        list.unhighlight();
        memory.highlight(input);
        pool[buffer_size].highlight();
        jsav.umsg("a buffer stores sector " + input + " from storage");
        //jsav.effects.copyValue(memory, input, pool, buffer_size);
        pool[buffer_size].value(0, input);
        $("#input").attr("disabled", "disabled");
        into_list = 1;
      }
      else if (into_list == 1) {
        jsav.umsg("buffer is placed into a list");
        pool[buffer_size].unhighlight();
        list.unhighlight();
        list.value(buffer_size, input);
        list.highlight(buffer_size);
        into_list = 0;
        $("#input").removeAttr("disabled");
        buffer_size++;
      }
    }
    else {
      if (into_list == 0) {
        jsav.umsg("buffer pool full, least frequently used buffer will be replaced");
        var min = LFU_counter[list.value(0)];
        var min_index = 0;
        for (var i = 1; i < list.size(); i++) {
          if (LFU_counter[list.value(i)] < min) {
            min = LFU_counter[list.value(i)];
            min_index = i;
          }
        }
        list.unhighlight();
        list.highlight(min_index);
        empty_index = contains(list.value(min_index));
        pool[empty_index].highlight();
        LFU_index = min_index;
        into_list++;
        $("#input").attr("disabled", "disabled");
      }
      else if (into_list == 1) {
        list.unhighlight();
        LFU_counter[list.value(LFU_index)] = 0;
        list.value(LFU_index, "");
        pool[empty_index].unhighlight();
        pool[empty_index].value(0, "");
        into_list++;
      }
      else if (into_list == 2) {
        list.value(LFU_index, input);
        pool[empty_index].value(0, input);
        into_list = 0;
        $("#input").removeAttr("disabled");
      }
    }
    show_counters();
    drawlines();
  }
  // update the arrays to match the parameters
  function update() {
    buffer_size = 0;
    if (pool) {
      for (var i = 0; i < pool.length; i++) {
        pool[i].clear();
      }
    }
    if (list) {
      list.clear();
    }
    if (memory) {
      memory.clear();
    }
    jsav.clearumsg();

    var missingFields = [];
    // Ensure user selected replacement strategy
    if ($('#function').val() === '0') {
      missingFields.push('replacement strategy');
    }
    // Ensure user selected main memory size
    if ($('#mainmemory_size').val() === '0') {
      missingFields.push('main memory size');
    }
    // create new array for main memory
    else {
      var temp = [];
      for (var i = 0; i < $('#mainmemory_size').val(); i++) {
        temp[i] = "sector " + i;
        LFU_counter[i] = 0;
      }
      memory = jsav.ds.array(temp, {layout: "vertical", left: 100});
    }
    // Ensure user selected buffer pool size
    if ($('#bufferpool_size').val() === '0') {
      missingFields.push('buffer pool size');
    }
    else {
      var empty = [];
      empty.length = 1;
      for (var i = 0; i < $('#bufferpool_size').val(); i++) {
        pool[i] = jsav.ds.array(empty, {layout: "vertical", left: 330, top: (i* 75)});
      }
      empty.length =  $('#bufferpool_size').val();
      list = jsav.ds.array(empty, {layout: "vertical", left: 550});
    }
    // disable input box if fields are missing
    if (missingFields.length > 0) {
      $("#input").attr("disabled", "disabled");
      $("#next").attr("disabled", "disabled");
    }
    // diable parameters once users finished selecting
    else {
      $("#input").removeAttr("disabled");
      $("#next").removeAttr("disabled");
      $("#function").attr("disabled", "disabled");
      $("#mainmemory_size").attr("disabled", "disabled");
      $("#bufferpool_size").attr("disabled", "disabled");
      jsav.umsg("Enter a value and click Next");
    }
  }

  $(document).ready(initialize);
  $("#function").change(update);
  $("#mainmemory_size").change(update);
  $("#bufferpool_size").change(update);
  $('#next').click(next);
  $('#reset').click(function () {
    location.reload(true);
  });
}(jQuery));
