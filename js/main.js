window.onload = setMap();

//set up choropleth map
function setMap(){

	 //map frame dimensions
    var width = 960,
        height = 460;

     //create new svg container for the map
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
        .scale(1000)
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

       var graticule = d3.geo.graticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

       var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

       var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

        var northAmerica = topojson.feature(states, states.objects.usa).features;
            
        //examine the results
        console.log(northAmerica);


        // var country = map.append("path")
        //     .datum(northAmerica)
        //     .attr("class", "northAmerica")
        //     .attr("d", path);

         var regions = map.selectAll(".regions")
            .data(northAmerica)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.state;
            })
            .attr("d", path);

    };
            
  };