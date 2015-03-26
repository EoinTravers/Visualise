
// Issues:
//
// Label conditions, and pick colours.
// Option of raw, or normalized time?

var step = 1                    // What time point to show after loading?
var n_steps = 500               // Length of data (in frames)
var realTime = 10000            // Real duration

// Using raw time data
var defaultStepText = "seconds"
function getStepLabel(step) {
    var seconds = Math.round(step * 20 * 100) / 100000
    return String(seconds) + " " + defaultStepText }

// Animation/manipulation variables/functions
// Declared globally so they can be accessed later
var play
var stop
var fps = 30;                   // These are only defaults, I'm not
                                // sure they're even used any more
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;
var speedSelector = document.getElementById("speed")
var requestId = 0;
var totalTime
var transition_time  = Math.floor(totalTime / n_steps)
var startTime = null
var deltaTime = null
var lastStep = null
var lastTime = null
var mousemode = true


// Setup settings for graphic
var canvas_width = 1000;
var canvas_height = 600;
var padding = 30;  // for chart edges

// Create scale functions
// For now, let axes scale themselves.
var xScale = d3.scale.linear()  // xScale is width of graphic
    .domain([-1.1, 1.1])
    .range([padding, canvas_width - padding * 2]); // output range

var yScale = d3.scale.linear()  // yScale is height of graphic
    .domain([-.1, 1.6])
    .range([canvas_height - padding, padding]);  // remember y starts
                                                 // on top going down
                                                 // so we flip

var colorScale = d3.scale.category10();
// Should manually override this.

// Define X axis
var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(5);

// Define Y axis
var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(5);

console.log("Defined axes")

// Create SVG element
var svg = d3.select("#chart")  // This is where we put our vis
    .append("svg")
    .attr("width", canvas_width)
    .attr("height", canvas_height)

d3.json('plot.json', function(json) {
    var dataset = json;
    console.log("Data loaded")

    //Create Circles
    svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")  // Add circle svg
        .attr("cx", function(d) {
            return xScale(d.path[step][0]);  // Circle's X
        })
        .attr("cy", function(d) {  // Circle's Y
            return yScale(d.path[step][1]);
        })
        .attr("r", 5)  // radius
        .style("fill", function(d) { return colorScale(d.condition); } );

    var stepText = svg.append('text')
        .text("0 " + defaultStepText)
        .attr("x", xScale(-1))
        .attr("y", yScale(0))

    console.log("Circles created")

    // Add to X axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (canvas_height - padding) +")")
        .call(xAxis);

    // Add to Y axis
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + padding +",0)")
        .call(yAxis);

    var minX = xScale.range()[0]
    var maxX = xScale.range()[1]
    var minY = yScale.range()[1]
    var maxY = yScale.range()[0]

    var lastStep = null

    // Interaction
    svg.on('mousemove', function(){
        if (mousemode){
            yClick = (d3.mouse(this)[1] - minY) / maxY
            if (yClick > .9){
                xClick = (d3.mouse(this)[0] - minX) / maxX
                step = Math.round(xClick * n_steps)
                if (step > n_steps) step = n_steps
                if (step < 0) step = 0
                transition_time = 50
                if (step != lastStep){
                    drawStep(step)
                    last_step = step
                }
            }
        }
    })

    function doStep(timestamp) {
        // if (!startTime) startTime = timestamp;
        deltaTime = Date.now() - startTime
        var progress = deltaTime / totalTime;
        // console.log(progress)
        step = Math.round(n_steps*progress)
        if (step != lastStep){
            // transition_time = timestamp - lastTime
            drawStep(step)
            lastStep = step
            lastTime = timestamp
        }
        if ((progress < 1) & (step < n_steps)) {
            requestId = window.requestAnimationFrame(doStep);
        }
        else{
            stop()
        }
    }

    // Update screen
    // var tailLen = 10

    drawStep = function(step) {
        svg.selectAll("circle")
            .data(dataset)  // Update with new data
            .transition()  // Transition from old to new
            .duration(transition_time)  // Length of animation
            .ease('linear')
            .attr("cx", function(d) {
                return xScale(d.path[step][0]);  // Circle's X
            })
            .attr("cy", function(d) {  // Circle's Y
                return yScale(d.path[step][1]);
            })

        // svg.selectAll("path")
        //     .data(dataset)
        //     .transition()
        //     .duration(transition_time)  // Length of animation
        //     .ease('linear')
        //     .attr("d", function(d){lineFunction(d)})
        stepText.text(getStepLabel(step))
    }
    play = function () {
        mousemode=false
        var slowBy = Number(speedSelector.value)
        if (isNaN(slowBy)){
            alert("Please enter a valid number.")
            return (-1)
        }
        totalTime = realTime * slowBy
        startTime = Date.now()
        transition_time = Math.floor(totalTime / n_steps)
        requestId = window.requestAnimationFrame(doStep); 
    }

    stop = function()
    {
        cancelAnimationFrame(requestId)
        mousemode=true
    }
   
});

