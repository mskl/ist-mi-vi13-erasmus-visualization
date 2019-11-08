var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var unemployment = d3.map();
var stateNames = d3.map();

var path = d3.geoPath();

var x = d3.scaleLinear()
    .domain([1, 10])
    .rangeRound([600, 860]);

var color = d3.scaleThreshold()
    .domain(d3.range(0, 10))
    .range(d3.schemeBlues[9]);

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

g.selectAll("rect")
    .data(color.range().map(function(d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Unemployment rate");

g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat(function(x, i) { return i ? x : x + "%"; })
    .tickValues(color.domain()))
    .select(".domain")
    .remove();

var promises = [
    d3.json("https://d3js.org/us-10m.v1.json"),
    d3.tsv("data/map/us-state-names.tsv", function(d) {
        stateNames.set(d.id, d.name)
    }),
    d3.tsv("data/map/map.tsv", function(d) {
        console.log("d in map", d);
        unemployment.set(d.name, +d.value);
    })
]
console.log("before promises")
Promise.all(promises).then(ready)

function ready([us]) {
    console.log("in ready", topojson.feature(us, us.objects.states).features)
    console.log("statenames", stateNames)
    console.log("employment", unemployment)
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("fill", function(d) {
            console.log("d", d)
            console.log("unemployment", unemployment)
            var sn = stateNames.get(d.id)
            console.log("sn",sn)
            d.rate = unemployment.get(stateNames.get(d.id)) || 0
            console.log("rate", d.rate)
            var col =  color(d.rate);
            console.log("col", col)
            if (col) {
                console.log("found col", col, "for d", d)
                return col
            } else {
                return '#ffffff'
            }
        })
        .attr("d", path)
        .append("title")
        .text(function(d) {
            console.log("title", d)
            return d.rate + "%"; });

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path);
}
