import * as d3 from "https://cdn.skypack.dev/d3@7";
import { GroupedBarChart, ForceGraph } from "./graphs.js";

const orinalValues = ["production budget", "box office"];
const fetchData = async function () {
	const rawData1 = await d3.csv("./data/mcu_box_office.csv");
	//const rawData2 = await d3.tsv("./data/test.tsv");
	const rawData2 = await d3.tsv("./data/redditLinks.tsv");
	return [
		rawData1.flatMap((d) => [
			{
				name: d.movie_title,
				field: "production budget",
				value: +d.production_budget.split(",").join(""),
			},
			{
				name: d.movie_title,
				field: "box office",
				value: +d.worldwide_box_office.split(",").join(""),
			},
		]),
		rawData2,
	];
};
const [data1, data2] = await fetchData();
const chart1Div = document.getElementById("chart1");
const chart2Div = document.getElementById("chart2");
const chart1 = GroupedBarChart(data1, {
	x: (d) => d.name,
	y: (d) => d.value / 1e6,
	z: (d) => d.field,
	yLabel: "↑ $USD (millions)",
	zDomain: orinalValues,
	colors: d3.schemeSpectral[2],
	width: 1000,
	height: 1000,
	marginBottom: 200,
});

function filter(data) {
	const linkMap = new Map();
	const filtered = [];
	for (const edge of data) {
		const edgeID = edge.SOURCE_SUBREDDIT + "/" + edge.TARGET_SUBREDDIT;
		if (linkMap.has(edgeID)) {
			linkMap.set(edgeID, linkMap.get(edgeID) + 1);
		} else {
			linkMap.set(edgeID, 1);
		}
		if (linkMap.get(edgeID) > 150) {
			filtered.push(edge);
		}
	}
	return filtered;
}
function getNodesAndLinks(data) {
	const nodesID = new Set();
	const nodes = [];
	const links = [];
	for (const edge of data) {
		if (!nodesID.has(edge.SOURCE_SUBREDDIT)) {
			nodes.push({ id: edge.SOURCE_SUBREDDIT });
		}
		if (!nodesID.has(edge.TARGET_SUBREDDIT)) {
			nodes.push({ id: edge.TARGET_SUBREDDIT });
		}
		nodesID.add(edge.SOURCE_SUBREDDIT);
		nodesID.add(edge.TARGET_SUBREDDIT);
		links.push({
			source: edge.SOURCE_SUBREDDIT,
			target: edge.TARGET_SUBREDDIT,
		});
	}
	return { nodes: nodes, links: links };
}
const chart2 = ForceGraph(getNodesAndLinks(filter(data2)), {
	nodeId: (d) => d.id,
	nodeGroup: (d) => d.id,
	width: 1000,
	height: 1000,
});

chart1Div.appendChild(chart1);
chart2Div.appendChild(chart2);
