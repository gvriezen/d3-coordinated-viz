(function (){
//psuedo-global variables
//variables for data join
    var attrArray = ["Medicare Beneficiaries (%)", "Hospital Beds Per 1000 People", "Need Met in HPSAs (%)", "Cost Barriers (%)", "Medicare Spending Per Enrollee"];
    var expressed = attrArray[0]; //intial attribute

    var chartWidth = window.innerWidth * 0.5,
        chartHeight = 473;
        leftPadding = 25,
        rightPadding = 2, 
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var yScale = d3.scale.linear ()
        .range([0, 460])
        .domain([25, 0]);

    var currentVariable = attrArray[0];

    // var currentArray = []; // holds current scale rendered on map

    // create second svg element to hold bar chart

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

	 //map frame dimensions
    var width = window.innerWidth * 0.6,
        height = 460;

     //create new svg container for the map

    var siteTitle = d3.select("body")
        .append("text")
        .attr("class", "siteTitle")
        .html("Quality and Access of US Healthcare");
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geo.albersUsa()
        // .center([39, 98])
        // .rotate([-2, 0, 0])
        // .parallels([43, 62])
        .scale(900)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);


	var q = d3_queue.queue();
	//queue
    //use queue.js to parallelize asynchronous data loading
    q
        .defer(d3.csv, "data/lab2data.csv") //load attributes from csv
        .defer(d3.json, "data/usa.topojson") //load background spatial data
        .await(callback);

    function callback(error, csvData, states){
       //translate north america TopoJSON
       //place graticule on map
        setGraticule(map, path);
        //translate us topojson
       var northAmerica = topojson.feature(states, states.objects.usa).features;

       northAmerica = joinData(northAmerica, csvData);
       //set up color scale
       var colorScale = makeColorScale(csvData);
       //add enumeration units
       setEnumerationUnits (northAmerica, map, path, colorScale);

       setChart (csvData, colorScale);

       createDropdown (csvData);

       // dynamicScale (csvData);
   };

}; //end of setmap function


// bar chart
function setChart(csvData, colorScale) {
    // create second svg element to hold bar chart

    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart")

         

    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    // set bars for each state
    var bars = chart.selectAll (".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b) {
            return a[expressed] - b[expressed]
        })
        .attr("class", function(d) {
            return "bars" + "regions " + d.name;
        })
        .attr("width", chartWidth / csvData.length - 2) 
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

    var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');

    // var numbers = chart.selectAll(".numbers")
    //     .data(csvData)
    //     .enter()
    //     .append("text")
    //     .sort(function(a, b){
    //         return a[expressed]- b[expressed]
    //     })
    //     .attr("class", function(d){
    //         return "numbers " + d.name;
    //     })
    //     .attr("text-anchor", "middle")
    //     .attr("x", function(d, i){
    //         var fraction = (chartWidth - 27) / csvData.length;
    //         return (i * fraction + (fraction - 1) / 2) + 25;
    //     })
    //     .attr("y", function(d){
    //         return chartHeight - yScale(parseFloat(d[expressed])) - 20;
    //     })
    //     .text(function(d){
    //         return d[expressed];
    //     });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle");
        // .text("Number of Variable A for each state");

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    updateChart(bars, csvData.length, colorScale);

};   //end of setChart()



function makeColorScale(data) {
    var colorClasses = [
        "#ccf2ff",
        "#66d9ff",
        "#00bfff",
        "#007399",
        "#002633"
    ];
    //create color sequence generator

    var colorScale = d3.scale.quantile ()
        .range(colorClasses);
    //build array of all values of the expressed attributes
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;

};

// function dynamicScale (csvData, currentVariable) {
//     for (var i in csvData) {
//         if (currentVariable == "Medicare Beneficiaries (%)" || currentVariable == "Cost Barriers (%)") {
//             currentArray == [0, 25];
//             scale = d3.scale.ordinal();
//         } else if (currentVariable == "Hospital Beds Per 1000 People") {
//               currentArray == [0, 4];
//               // scale = d3.scale.ordinal();

//         } else if (currentVariable == "Need Met in HPSAs (%)"){
//             currentArray == [0, 4];
//              // scale = d3.scale.ordinal();

//         } else if (currentVariable == "Medicare Spending Per Enrollee"){
//             currentArray == [0, 10000];
//              // scale = d3.scale.ordinal();
//         };
//     };

//     scale.domain(currentArray); //pass arrays as domain values
//     return scale;
// };
  

function choropleth (props, colorScale) {
    var val = parseFloat (props[expressed]);

    if (val && val != NaN) {
        return colorScale (val);
    } else {
        return "#CCC";
    };
};


function setGraticule (map, path) {

       var graticule = d3.geo.graticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

       var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

       // var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
       //      .data(graticule.lines()) //bind graticule lines to each element to be created
       //      .enter() //create an element for each datum
       //      .append("path") //append each element to the svg as a path element
       //      .attr("class", "gratLines") //assign class for styling
       //      .attr("d", path); //project graticule lines
 };

        
        // loop through csv sheet to assign each set of attribute values to geojson region
function joinData(northAmerica, csvData){
            for (var i=0; i<csvData.length; i++){
                var csvRegion = csvData[i]; //the current region
                var csvKey = csvRegion.name; // the csv primary key
        // loop through geojson regions to find correct region
            for (var a=0; a<northAmerica.length; a++) {

                var geojsonProps = northAmerica[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.name; // geojson primary key 
            //where primary keys match, transfer csv data to geojson prop object
            if (geojsonKey == csvKey){
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attr value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };

    };

    return northAmerica;
};
    
function setEnumerationUnits (northAmerica, map, path, colorScale){
        var regions = map.selectAll(".regions")
            .data(northAmerica)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.name;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            })
            .on("mouseover", function(d){
                highlight(d.properties);
            })
            .on("mouseout", function(d){
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);

        var desc = regions.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');

    };

function createDropdown(csvData) {
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    //add initial option
    var titleOption = dropdown.append("option")
        .attr ("class", titleOption)
        .attr("disabled", "true")
        .text("Select Attribute");
    //add attribute name options

    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter ()
        .append("option")
        .attr("value", function(d) { return d})
        .text(function (d) { return d});
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;
    //recreate color scale
    var colorScale = makeColorScale(csvData);
    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function (d) {
            return choropleth(d.properties, colorScale)
        });

    var bars = d3.selectAll(".bars")
    //resort bars
        .sort(function(a, b) {
        return a[expressed] - b[expressed];
        });
        // .attr("x", function(d, i){
        //     return i * (chartInnerWidth / csvData.length) + leftPadding;
        // })
        // //resize bars
        // .attr("height", function(d, i){
        //     return 463 - yScale(parseFloat(d[expressed]));
        // })
        // .attr("y", function(d, i){
        //     return yScale(parseFloat(d[expressed])) + topBottomPadding;
        // })
        // //recolor bars
        // .style("fill", function(d){
        //     return choropleth(d, colorScale);
        // })

        // .transition() // add animation
        // .delay(function (d, i) {
        //     return i * 20
        // })
        // .duration(500);

        updateChart (bars, csvData.length, colorScale);
        updateDescriptions (csvData);
    }; // end of change attribute

function updateChart (bars, n, colorScale) {
        bars.attr("x", function(d, i){
        return i * (chartWidth / n ) + leftPadding;
        })
    //resize bars
         .attr("height", function(d, i){
        return 463 - yScale(parseFloat(d[expressed]));
        })
         .attr("y", function(d, i){
        return yScale(parseFloat(d[expressed])) + topBottomPadding;
         })
    //recolor bars
         .style("fill", function(d){
        return choropleth(d, colorScale);
        });

    var chartTitle = d3.select(".chartTitle")
        .text("Number of " + attrArray[0] + " in each state");


};

function highlight(props){
    //change stroke
    var selected = d3.selectAll ("." + props.name)
        .style({
            "stroke": "#ff4d4d",
            "stroke-width": "2.5"
        });
    setLabel(props);
};

function dehighlight(props){
    var selected = d3.selectAll ("." + props.name) // deleted "." and removed null nodes? 
        .style({
            "stroke": function() {
                return getStyle (this, "stroke")
            },
            "stroke-width": function(){
                return getStyle(this, "stroke-width")
            }
        });
    function getStyle (element, styleName) {
        var styleText = d3.select(element)
        .select("desc")
        .text();
        var styleObject = JSON.parse(styleText);

    return styleObject[styleName];
        };
    d3.select(".infolabel")
        .remove();
};

function setLabel (props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr({
            "class": "infolabel",
            "id": props.name + "_label"
        })
        .html(labelAttribute);
    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

function moveLabel () {

    // //get width of label
    var labelWidth = d3.select(".infolabel")
        .node ()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove to set coordinates of label
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;
    //horizontal label coordinate; test for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate; test for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style ({
            "left": x + "px",
            "top": y + "px"
        });
};

})();
            
  //range = output
  //domain = input