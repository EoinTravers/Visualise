// Define chart dimensions and axes
var margin = {top: 20, right: 20, bottom: 30, left: 50},
width = 600 - margin.left - margin.right,
height = 480 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([0, 1])
    .range([0, width]);

var y = d3.scale.linear()
// var y = d3.scale.pow().exponent(Math.E) //
    .domain([0, .5])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

// Creat the chart, and axes
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("");


// Functions for drawing the chart itself

var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d, i) { return x(xvals[i]); })
    .y(y);

function draw() {
    updateLines();
    x.domain([minX, maxX])
    svg.selectAll(".line")
        .data(yvals)
        .enter().append("path")
        .attr("class", "line")
        .attr("d", line)
        .attr("data-legend", function(d, i) { return conditions[i]})
        .style("stroke", function(d, i) { return colorScale(conditions[i])})
}

function redraw() {
    if(firstDraw){
        draw();
        firstDraw = false;
    }
    else{
        updateLines();
        x.domain([minX, maxX])
        // TODO - Support automatic scaling of Y axis

        // var minY = d3.min(yvals[1])
        // var maxY = d3.max(yvals[1])
        // var dY = maxY - minY
        // y.domain([minY-(dY*.1), maxY+(dY*.1)])
        svg.selectAll(".line")
            .data(yvals)
            .transition()  // Transition from old to new
            .duration(800)  // Length of animation
            .ease("linear")
            .attr("d", line);
    }
}

var firstDraw = true
window.onload = function(){
    // Don't do anything for now!
    // parseLme4();
    // draw();
}


// Legend stuff
var conditions = ["Condition 1", "Condition 2"]
var colorScale = d3.scale.category10();

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("height", 100)
    .attr("width", 100)
    .attr('transform', 'translate(-20,50)') 

legend.selectAll('rect')
    .data(conditions)
    .enter()
    .append("rect")
    .attr("x", width*.1)
    .attr("y", function(d, i){ return height*.8 + i *  20;})
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function(d, i) { 
        return color = colorScale(conditions[i]); })

legend.selectAll('text')
    .data(conditions)
    .enter()
    .append("text")
    .attr("x", width*.13)
    .attr("y", function(d, i){ return height*.8 + i *  20 + 9; })
    .text(function(d, i) { return conditions[i]; });

// Functions for generating lines, given coefficients

function getPredicted (x, coefs) {
    // Get a predicted y value
    var pred = 0
    for(var i = 0; i < coefs.length; i++) {
        var dp = Math.pow(x, i)*coefs[i];
        pred += dp;
    }
    return (Math.exp(pred))
    // return (pred)
}

function inputToList (inputID) {
    // Read an <input> box of comma seperate values,
    // return them as an array.
    a = document.getElementById(inputID).innerHTML;
    b = a.replace(/\s/g, '').split(',');
    c = [];
    for(var i = 0; i < b.length; i++) {
        c.push(Number(b[i]))
    };
    return(c);
}

function parseLme4 (){
    // Experimental.

    // Read a <textarea> containing model coefficients table from R,
    // and, based on the normal order of terms, parse the coefficients
    // from it. The values are read into the environment, and the next
    // function, `populateCoefTable()`, pulls them into a table that
    // can be manipulated.
    
    // This relies on on having a table of the form ('#' not necessary):

    // ## (Intercept)        -1.36739    0.12195  -11.21  < 2e-16 ***
    // ## variableother       0.00814    0.07342    0.11  0.91175    
    // ## rot1               -0.25056    0.59866   -0.42  0.67556    
    // ## rot2               -5.55935    1.58155   -3.52  0.00044 ***
    // ## rot3                2.88808    1.15688    2.50  0.01254 *  
    // ## variableother:rot1  0.82366    0.73417    1.12  0.26191    
    // ## variableother:rot2 -5.53496    1.98080   -2.79  0.00520 ** 
    // ## variableother:rot3  3.85031    1.47971    2.60  0.00927 ** 

    // with no lines below or above. 

    // In my experience, these tables, from polynomial regression
    // models with one condition variable, always have the same
    // format: the first line is the intercept in the baseline, the
    // second is the change in intercept in the other condition, and
    // the first half of the remaining rows show the linear,
    // quadratic, cubic (and so on) terms in the baseline, with the
    // remainder showing how these terms change in the other
    // condition.
    function coefFromLine(line){
        // Replace any number of spaces with `|`, and then take the
        // second value (the coefficient) in the resulting array.
        cols = line.replace(/\s{1,}/g, '|').split('|')
        return (Number(cols[1]))
    }
    var v = document.getElementById('lme4Output').value
    v = replaceAll(v, '## ', '')
    lines = v.split('\n')
    nCoefs = (lines.length)*.5;
    // Intercepts go first
    betaA = [coefFromLine(lines[0])]
    betaChange = [coefFromLine(lines[1])]
    // Split the remaining lines between each condition.
    var termsToGoEach = (lines.length - 2) * .5
    for(var i = 2; i < lines.length; i++) {
        var c = coefFromLine(lines[i])
        if(i < (termsToGoEach + 2)){
            console.log('A '+ i+ ' ' + c)
            betaA.push(c)
        } else {
            console.log('Change '+ i+ ' ' + c)
            betaChange.push(c)
        };
    }
    betaB = []
    for(var i=0; i<betaA.length; i++){
        betaB.push(betaA[i]+betaChange[i])
    }
    populateCoefTable();        // Now that we have these values, put them in an adjustable table.
    redraw();                   // Update chart
}

function populateCoefTable() {
    // Get, and clear table.
    var ctable = document.getElementById('coefsTable');
    ctable.innerHTML = ""
    document.getElementById('extractedDiv').style.display="inline";
    // rowNames are 'Intercept', then X^{whatever}
    var rowNames = ['Intercept'];
    for(var i = 1; i < nCoefs; i++) {
        rowNames.push('X<sup>'+i+'</sup>')
    }
    // Build the table
    for(var i = 0; i < nCoefs; i++) {
        console.log(i)
        var newRow = replaceAll(coefTableTemplate, '£', rowNames[i]) // `£` is a placeholder for the row label
        newRow = replaceAll(newRow, '$', i); // `$` is replaced by the row number (mostly for html IDs)
        ctable.innerHTML = ctable.innerHTML + newRow;
    }
    // Set coefficients in table
    for(var i = 0; i < nCoefs; i++) {
        document.getElementById('betaA'+i).value = betaA[i]
        document.getElementById('betaB'+i).value = betaB[i]
    }
}

d3.select('#coefsTable')
  .on('change', redraw)


// I think I'm having problems with orthogonal polynomials because the
// numbers end up very small, and I run out of precision. Maybe I can
// get around this with a scaling paramater?
var scaleBy = 1

// These variables need to be declared globally so they can accessed
// outside of the functions that use them.
var minX
var maxX
var betaA
var betaChange
var betaB
var xvals
var yvals
var nLines
var betas
var nCoefs

// Temporarily support multiple input methods this way.
// Will change to a user-accesible menu.
// 'C' is currently the best method.
var inputMethod = 'C'
function updateLines(){
    minX = document.getElementById('minX').value * scaleBy;
    maxX = document.getElementById('maxX').value * scaleBy;
    dX = maxX - minX
    xvals = d3.range(minX, maxX+.001, dX*.05)
    if (inputMethod == 'A'){
        // First method implemented - parse coeficients from comma seperated lists
        betaA = inputToList('betaA')
        betaChange = inputToList('betaChange')
        betaB = []
        for(var i=0; i<betaA.length; i++){
            betaB.push(betaA[i]+betaChange[i])
        }
    }
    if (inputMethod == 'B'){
        // Seconds method - Read from a table of <input> boxes
        // Now mostly integrated into Method 'C'
        betaA = []
        betaB = []
        for(var i = 0; i < nCoefs; i++) {
            var bA = Number(document.getElementById('betaA$'.replace('$', i)).value);
            var bB = document.getElementById('betaB$'.replace('$', i+1));
            // var bB = bA + Number(document.getElementById('betaChange$'.replace('$', i)).value);
            betaA.push(bA);
            betaB.push(bB);
        }
    }
    if (inputMethod=='C'){
        // Current method Coefficients are parsed from large
        // <textarea> containing R output and cofficients are inserted
        // into table of <inputs>.  From there, the values are passed
        // on to the chart, but can also be edited, and terms can be
        // made not differ between conditions. A d3 `.on('change')`
        // option is used to watch for activity on this table, and
        // updates the chart when it happens, in a nice transition,
        // the length of which is hard-coded.
        betaA = []
        betaB = []
        for(var i = 0; i < nCoefs; i++) {
            var bA = Number(document.getElementById('betaA$'.replace('$', i)).value);
            // var bB = document.getElementById('betaB$'.replace('$', i+1));
            var bB = Number(document.getElementById('betaB$'.replace('$', i)).value);
            betaA.push(bA);
            betaB.push(bB);
        }
    }        
    // Nice addition: Check if the 'noVary' checkbox has been ticked
    // for any coefficient, and if so, get the average value across
    // both conditons, and use it for both.

    // This provides a way of demonstrating (with nice animation) the
    // specific effect of having the model differ on each coefficient,
    // or group of coefficient.
    for(var i = 0; i < nCoefs; i++) {
        checked = document.getElementById('noVary' + (i)).checked;
        if (checked){
            var mean = (betaA[i] + betaB[i]) / 2;
            betaA[i] = mean;
            betaB[i] = mean;
        }
    }
    yvals = []
    nLines = 2
    betas = [betaA, betaB];
    console.log(betas)
    for (var i=0;i<nLines;i++){
        var tmpVals = []
        for(var j = 0; j < xvals.length; j++) {
            tmpVals.push(
                getPredicted(xvals[j], betas[i]))
        }
        yvals.push(tmpVals)
    }
}



var coefTableTemplate = '\
          <tr id="coefRow$">\
            <td>£</td>\
            <td>\
              <input id="betaA$" name="" type="number" value=0 step=.01 style="width: 9em">\
            </td>\
            <td>\
              ...<input style="display:none" "id="betaChange$" name="" type="number" value=0 step=.01 style="width: 9em">\
            </td>\
            <td>\
              <input id="betaB$" name="" type="number" value=0 step=.01 style="width: 9em">\
            </td>\
            <td>\
              <input id="noVary$" type="checkbox">\
            </td>\
          </tr>\
'

// http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

// TODO - Make it possible to manually add elements
// after parsing from R output.

// function addCoefRow() {
//     nCoefs++;
//     var ctable = document.getElementById('coefsTable');
//     var newRow = replaceAll(coefTableTemplate, '$', nCoefs);
//     ctable.addChild + replaceAll(newRow, '£', 'X<sup>'+(nCoefs-1)+'</sup>');
// }
// function removeCoefRow() {
//     if(nCoefs == 2){
//         alert("Must have at least two terms.")
//     } else {
//         var id = 'coefRow' + nCoefs;
//         console.log(id);
//         var badRow = document.getElementById(id);
//         badRow.parentNode.removeChild(badRow);
//         nCoefs--;
//     }
// }


