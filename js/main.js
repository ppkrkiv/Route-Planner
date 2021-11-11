"use strict";

var mymap;
var route = [];
var totalDistance;
var totalCalories = 0;
var totalTime;
var polylines = new Map();
var markers = new Map();


let user = class {
	constructor(weight, speed) {
		this.weight = weight;
		this.speed = speed;
	}
}

function main() {
	mapSetup();
	setDefaultUser(user);
	setButtonListeners();
}

//defaults in km/h and kg
function setDefaultUser(user) {
	user.speed = 5;
	user.weight = 75;
}


/**
 * Currently not in use due to insecure connection 
 */
function locateUser(map) {
	map.locate({setView: true}) /* This will return map so you can do chaining */
	.on('locationfound', function(e){
		var marker = L.marker([e.latitude, e.longitude]).bindPopup('Am I somewhat correct? :)');
		var circle = L.circle([e.latitude, e.longitude], e.accuracy, {
			weight: 1,
			color: '#bd34eb',
			fillColor: '#bd34eb',
			fillOpacity: 0.2
		});
		map.addLayer(marker);
		map.addLayer(circle);
	})
   .on('locationerror', function(e){
		console.log(e);
		alert("Location access was denied due to insecure connection");
	});
}

function mapSetup() {
    mymap = L.map('map', { zoomControl:false}).setView([64.24, 25.75], 5);
	L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(mymap);
	mymap.on('click', onMapClick);
	//locateUser(mymap);
}

function setButtonListeners() {
	let buttonSidenav = document.querySelector('#sidenavButton');
	buttonSidenav.addEventListener('click', openNav);

	let buttonClosesidenav = document.querySelector('#closeSidebar');
	buttonClosesidenav.addEventListener('click', closeNav);

	let undo = document.querySelector('#undo');
	undo.addEventListener('click', removeLastMarker);

	let reset = document.querySelector('#reset');
	reset.addEventListener('click', resetRoute);

	let counterBox = document.querySelector('#DistCounter');
	counterBox.addEventListener('click', customiseUser);
}

function customiseUser() {
	return;
}

function resetRoute() {
	for(let key of polylines.keys()) {
		polylines.get(key).remove(mymap);
		polylines.delete(key);
	}

	for(let key of markers.keys()) {
		markers.get(key).remove(mymap);
		markers.delete(key);
	}

	route = [];
	totalDistance = 0;
	totalCalories = 0;
	let p = document.querySelector('#distance');
	p.textContent = "0.000";
	let p2 = document.querySelector('#time');
	p2.textContent = "00:00:00";
	let p3 = document.querySelector('#caloriesCount');
	p3.textContent = "0";
	updateMarkerCount();
}

function updateMarkerCount() {
	let marker = document.querySelector('#markers');
	marker.textContent = markers.size;
}

function removeLastMarker() {
	let markerId = "marker" + (markers.size - 1).toString();
	let polylineId = "polyline" + (polylines.size - 1).toString();
	
	if(markers.size > 0) {
		markers.get(markerId).remove(mymap);
		markers.delete(markerId);
	}

	if(polylines.size > 0) {
		polylines.get(polylineId).remove(mymap);
		polylines.delete(polylineId);
	}

	if(route.length > 0) {
		route.pop();
	}
	countDistance();
	countTime();
	countburnedCalories();
	updateMarkerCount();
}



function onMapClick(e) {

	let lat = e.latlng.lat;
	let lng = e.latlng.lng;
	addToRoute(lat, lng);
	let marker = L.circle ([lat, lng],{
		color: '#7726ad',
		fillColor: '#7726ad',
		fillOpacity: 0.8,
		radius: 4
	}).addTo(mymap);
	markers.set("marker" + markers.size, marker);
	if(route.length > 1) {
		drawPolyline();
		countDistance();
		countTime();
		countburnedCalories();
	}
	updateMarkerCount();
}

function drawPolyline() {
	let latlngs = [
		[route[route.length - 2].latitude, route[route.length - 2].longitude],
		[route[route.length - 1].latitude, route[route.length - 1].longitude]
	];
	let polyline = L.polyline(latlngs, {color: '#7726ad'}).addTo(mymap);
	polylines.set("polyline" + polylines.size, polyline);
}

function countDistance() {
	let distance = 0;
	totalDistance = 0;
	for(let i=0; i < route.length - 1; i++) {
		distance = getDistanceFromLatLonInKm(route[i].latitude, route[i].longitude, route[i+1].latitude, route[i+1].longitude); 
		totalDistance += distance;
	}
	let p = document.querySelector('#distance');
	p.textContent = totalDistance.toFixed(3);
}

/* 
Based on the MET value
*/
function countburnedCalories() {
	let met = user.speed - 1;
	let weight = user.weight;
	let time = totalTime.split(':');
	let minutes = (+time[0]) * 60 + (+time[1]);
	totalCalories = minutes * (met * 3.5 * weight) / 200;
	let indicator = document.querySelector('#caloriesCount');
	indicator.textContent = totalCalories.toFixed(0);
}

//Thanks to Andrew Willems for the time conversion snippet
function countTime() {
	let decimalTime = totalDistance/user.speed.toFixed(4);
	var n = new Date(0,0);
	n.setSeconds(+decimalTime * 60 * 60);
	totalTime = n.toTimeString().slice(0, 8);
	let timeIndicator = document.querySelector('#time');
	timeIndicator.textContent = totalTime;
}

function addToRoute(lat, lng) {
	var checkpoint = {latitude: parseFloat(lat),
				  longitude: parseFloat(lng), 
				  id: "checkpoint" + route.length};
	route.push(checkpoint);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	let R = 6371; // Radius of the earth in km
	let dLat = deg2rad(lat2 - lat1); // deg2rad below
	let dLon = deg2rad(lon2 - lon1);
	let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	let d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180);
}

function openNav() {
	document.getElementById("mySidenav").style.width = "250px";
}
  
function closeNav() {
	document.getElementById("mySidenav").style.width = "0";
}

window.onload = () => main();