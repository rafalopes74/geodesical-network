/*     Rede Geodésica Nacional

Aluno 1: 57464 Diogo Rosa <-- mandatory to fill
Aluno 2: 57652 Rafael Lopes <-- mandatory to fill

Comentario:

O ficheiro "rng.js" tem de incluir, logo nas primeiras linhas,
um comentário inicial contendo: o nome e número dos dois alunos que
realizaram o projeto; indicação de quais as partes do trabalho que
foram feitas e das que não foram feitas (para facilitar uma correção
sem enganos); ainda possivelmente alertando para alguns aspetos da
implementação que possam ser menos óbvios para o avaliador.

0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

HTML DOM documentation: https://www.w3schools.com/js/js_htmldom.asp
Leaflet documentation: https://leafletjs.com/reference-1.7.1.html
*/



/* GLOBAL CONSTANTS */

const MAP_CENTRE =
	[38.661,-9.2044];  // FCT coordinates
const MAP_ID =
	"mapid";
const MAP_ATTRIBUTION =
	'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
	+ 'contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
	'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='
	+ 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
const MAP_ERROR =
	"https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg";
const MAP_LAYERS =
	["streets-v11", "outdoors-v11", "light-v10", "dark-v10", "satellite-v9",
		"satellite-streets-v11", "navigation-day-v1", "navigation-night-v1"]
const RESOURCES_DIR =
	"resources/";
const VG_ORDERS =
	["order1", "order2", "order3", "order4"];
const RGN_FILE_NAME =
	"rgn.xml";

/* GLOBAL VARIABLES */

let map = null;

let layers_by_orders = new Array(VG_ORDERS.length);


let vgs_by_orders = new Array(VG_ORDERS.length);


let ordersStats = new Array(VG_ORDERS.length);

let totalVis = 0;

let totalNVis = 0;

let maxAltitude = null;

let minAltitude = null;

let layers_circles = new Array(VG_ORDERS.length);



let layers_types = new Array(VG_ORDERS.length);


let areThereCircles = false;

let areThereTypesCircles = false;

let areThereCircles30km = false;

let last_type = "";

let totalclusterMarkers;

let totalCirclesclusterMarkers; 

let totalTypesCircles;

let circlesWithInUnder30km;

let layers_under30km = new Array(VG_ORDERS.length);


/* USEFUL FUNCTIONS */

// Capitalize the first letter of a string.
function capitalize(str)
{
	return str.length > 0
			? str[0].toUpperCase() + str.slice(1)
			: str;
}

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2)
{
    function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
    let dLat = toRad(lat2 - lat1), dLon = toRad (lon2 - lon1);
    let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
    let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
    return 6372.8 * 2.0 * Math.asin (Math.sqrt(a))
}

function loadXMLDoc(filename)
{
	let xhttp = new XMLHttpRequest();
	xhttp.open("GET", filename, false);
	try {
		xhttp.send();
	}
	catch(err) {
		alert("Could not access the local geocaching database via AJAX.\n"
			+ "Therefore, no POIs will be visible.\n");
	}
	return xhttp.responseXML;	
}

function getAllValuesByTagName(xml, name)  {
	return xml.getElementsByTagName(name);
}

function getFirstValueByTagName(xml, name)  {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}


/* POI */

class POI {
	constructor(xml) {
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
    }
    
    getLatitude(){
        return this.latitude;
    }

    getLongitude(){
        return this.longitude;
    }
}

class VG extends POI{
	constructor(xml) {
		super(xml);
		this.order = getFirstValueByTagName(xml, "order");
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");
		this.isValid = false;
		this.nVgsNearBy = -1;
		this.vgsUnder30km2=L.markerClusterGroup();

    }
	
	
	
	getVgsUnder30(){
		return this.vgsUnder30km2;

	}
	getType(){
		return this.type;
	}
    
    isThisValid(){
        return this.isValid;
    }

    putValid(){
        this.isValid = true;
    }

	altitude_circle(){
		let radius  = 50
        if(this.altitude != "ND") radius = 10*parseFloat(this.altitude);

		return L.circle([this.latitude,this.longitude],radius, {color: 'black', fillColor: 'gray', fillOpacity: 0.4});
	}

	put30km_circle(){
		return L.circle([this.latitude,this.longitude],200, {color: 'black', fillColor: 'yellow', fillOpacity: 0.4});
	}
	type_circle(){
		return L.circle([this.latitude,this.longitude],200, {color: 'gold', fillColor: 'orange', fillOpacity: 0.4});
	}
	circulos30km(){
	
		return L.circle([this.latitude,this.longitude],200, {color: 'gold', fillColor: 'orange', fillOpacity: 0.4});
	}

	addVGNearBy(vgs){
		let dist = haversine(this.latitude, this.longitude, vgs.getLatitude(), vgs.getLongitude());
		if(parceFloat(dist)<=60)
			nVgsNearBy++;
	}

	getnVgsNearBy(){
		return nVgsNearBy;
	}
}

class VG1 extends VG {
	constructor(xml) {
		super(xml);
		
    }
    
    checkValidation(vgs) {
        let dist = haversine(this.latitude, this.longitude, vgs.getLatitude(), vgs.getLongitude());
        if(dist<=60.0 && dist >=30.0){
            console.log("pixa");
             this.putValid()
             vgs.putValid();
         }
    }

	addVGNearBy(vgs){
		let dist = haversine(this.latitude, this.longitude, vgs.getLatitude(), vgs.getLongitude());
		if(dist<=60.0)
			this.nVgsNearBy +=1;
	}

	getnVgsNearBy(){
		return this.nVgsNearBy;
	}

	altitude_circle(){
		let radius  = 50
        if(this.altitude != "ND") radius = 10*parseFloat(this.altitude);

		return L.circle([this.latitude,this.longitude],radius, {color: 'red', fillColor: 'pink', fillOpacity: 0.4});
	}
    
}

class VG2 extends VG {
	constructor(xml) {
		super(xml);
    }
    checkValidation(vgs) {
       let dist = haversine(this.latitude, this.longitude, vgs.getLatitude(), vgs.getLongitude());
       if(dist<=30.0 && dist >=20.0){
            this.putValid()
            vgs.putValid();
        }
    }

	altitude_circle(){
		let radius  = 50
        if(this.altitude != "ND") radius = 10*parseFloat(this.altitude);

		return L.circle([this.latitude,this.longitude],radius, {color: 'green', fillColor: 'lime', fillOpacity: 0.4});
	}
	addVG30km(vgs){

		let dist = haversine(this.latitude, this.longitude, vgs.getLatitude(), vgs.getLongitude());
			return(parseFloat(dist)<=30.0);
			
	}


}

class VG3 extends VG {
	constructor(xml) {
		super(xml);
    }
    checkValidation(vgs) {
        let dist = haversine(this.latitude, this.longitude, vgs.getLatitude(), vgs.getLongitude());
        if(dist<=10.0 && dist >=5.0){
             this.putValid()
             vgs.putValid();
         }
    }

	altitude_circle(){
		let radius  = 50
        if(this.altitude != "ND") radius = 10*parseFloat(this.altitude);

		return L.circle([this.latitude,this.longitude],radius, {color: 'blue', fillColor: 'cyan', fillOpacity: 0.4});
	}
}

class VG4 extends VG {
	constructor(xml) {
		super(xml);
		this.isValid = true;
    }
    
    checkValidation(vgs) {}

	altitude_circle(){
		let radius  = 50
        if(this.altitude != "ND") radius = 10*parseFloat(this.altitude);

		return L.circle([this.latitude,this.longitude],radius, {color: 'gray', fillColor: 'white', fillOpacity: 0.6});
	}
}


/* MAP */

class Map {
	constructor(center, zoom) {
		this.lmap = L.map(MAP_ID).setView(center, zoom);
		this.addBaseLayers(MAP_LAYERS);
		let icons = this.loadIcons(RESOURCES_DIR);
		let vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME);
		this.populate(icons, vgs);
		this.addClickHandler(e =>
			L.popup()
			.setLatLng(e.latlng)
			.setContent("You clicked the map at " + e.latlng.toString())
        );
	}

	makeMapLayer(name, spec) {
		let urlTemplate = MAP_URL;
		let attr = MAP_ATTRIBUTION;
		let errorTileUrl = MAP_ERROR;
		let layer =
			L.tileLayer(urlTemplate, {
					minZoom: 6,
					maxZoom: 19,
					errorTileUrl: errorTileUrl,
					id: spec,
					tileSize: 512,
					zoomOffset: -1,
					attribution: attr
			});
		return layer;
	}

	addBaseLayers(specs) {
		let baseMaps = [];
		for(let i in specs)
			baseMaps[capitalize(specs[i])] =
				this.makeMapLayer(specs[i], "mapbox/" + specs[i]);
		baseMaps[capitalize(specs[0])].addTo(this.lmap);
		L.control.scale({maxWidth: 150, metric: true, imperial: false})
									.setPosition("topleft").addTo(this.lmap);
		L.control.layers(baseMaps, {}).setPosition("topleft").addTo(this.lmap);
		return baseMaps;
	}

	loadIcons(dir) {
		let icons = [];
		let iconOptions = {
			iconUrl: "??",
			shadowUrl: "??",
			iconSize: [16, 16],
			shadowSize: [16, 16],
			iconAnchor: [8, 8],
			shadowAnchor: [8, 8],
			popupAnchor: [0, -6] // offset the determines where the popup should open
		};
		for(let i = 0 ; i < VG_ORDERS.length ; i++) {
			iconOptions.iconUrl = dir + VG_ORDERS[i] + ".png";
		    icons[VG_ORDERS[i]] = L.icon(iconOptions);
		}
		return icons;
	}

	loadRGN(filename) {
		let xmlDoc = loadXMLDoc(filename);
		let xs = getAllValuesByTagName(xmlDoc, "vg");
		let orders_on_xml = getAllValuesByTagName(xmlDoc, "order");
		let vgs = [];
		if(xs.length == 0)
			alert("Empty file");
		else {
			for(let i = 0 ; i < xs.length ; i++){
				switch(orders_on_xml[i].innerHTML){
					case "1":
						vgs[i] = new VG1(xs[i]);
						break;
					case "2":
						vgs[i] = new VG2(xs[i]);
						break;
					case "3":
						vgs[i] = new VG3(xs[i]);
						break;
					case "4":
						vgs[i] = new VG4(xs[i]);
                        break;
					default:
						vgs[i] = new VG(xs[i]);
				}
			}
		}
		return vgs;
	}

	populate(icons, vgs)  {
		var aux;
	
		for(let i = 0 ; i < vgs.length ; i++){
            aux = vgs[i].order;
			if(aux == 1)
			for(let v = 0; v < vgs.length; v++){
				vgs[i].addVGNearBy(vgs[v]);}
			layers_by_orders[aux-1].addLayer(this.addMarker(icons, vgs[i]));
            vgs_by_orders[aux-1].push(vgs[i]);
			for(let f = 0; f < vgs_by_orders[aux-1].length; f++) { 
				vgs[i].checkValidation(vgs_by_orders[aux-1][f]);
			} 
		
            layers_circles[aux-1].addLayer(vgs[i].altitude_circle());
            
			if( maxAltitude == null || (vgs[i].altitude != "ND" && parseFloat(vgs[i].altitude) > parseFloat(maxAltitude.altitude))) 
            	maxAltitude = vgs[i];

            if(minAltitude == null || (vgs[i].altitude != "ND" && parseFloat(vgs[i].altitude) < parseFloat(minAltitude.altitude)))
            	minAltitude = vgs[i];
			totalNVis++;

		}

		document.getElementById("maxAltitude").innerHTML = maxAltitude.name;
    	document.getElementById("minAltitude").innerHTML = minAltitude.name;
	}

	addMarker(icons, vg) {
        let marker = L.marker([vg.latitude, vg.longitude], {icon: icons['order'+vg.order]});
        
		if(vg.order == 1){
		marker.bindPopup("Nome: <b>" + vg.name + "</b><br/>Ordem: <b>"+ vg.order + "</b><br/>Tipo: <b>" 
        + vg.type + "</b><br/>Altitude: <b>" + vg.altitude + "</b><br/>Latitude:<b> " 
        + vg.latitude + "</b><br/>Longitude:<b> " + vg.longitude + "</b><br/><br/>" + 
        '<FORM ID="' + vg.type + '"> <INPUT TYPE="button" VALUE="Mesmo Tipo" ONCLICK="showVgsOfThisType(form.id)"></FORM>'
		+ "</b><br/>" +'<FORM ID="' + vg.latitude +","+ vg.longitude +'"> <INPUT TYPE="button" VALUE="Street view" ONCLICK="showStreetView(form.id)"></FORM>'+
		"</b>Número de VGs a menos de 60km: <b>" + vg.getnVgsNearBy()) 
        .bindTooltip(vg.name);}
		else if(vg.order == 2){

        marker.bindPopup("Nome: <b>" + vg.name + "</b><br/>Ordem: <b>"+ vg.order + "</b><br/>Tipo: <b>" 
        + vg.type + "</b><br/>Altitude: <b>" + vg.altitude + "</b><br/>Latitude:<b> " 
        + vg.latitude + "</b><br/>Longitude:<b> " + vg.longitude + "</b><br/><br/>" + 
        '<FORM ID="' + vg.type + '"> <INPUT TYPE="button" VALUE="Mesmo Tipo" ONCLICK="showVgsOfThisType(form.id)"></FORM>'
		+ "</b><br/>" +'<FORM ID="' + vg.latitude +","+ vg.longitude +'"> <INPUT TYPE="button" VALUE="Street view" ONCLICK="showStreetView(form.id)"></FORM>'
		+"</b><br/>" +'<FORM ID="'+	vg.name +'"> <INPUT TYPE="button" VALUE="Ver vgs num raio de 30 " ONCLICK="putCirclesWithIn30km(form.id)"></FORM>')
        .bindTooltip(vg.name);}

		else{  marker.bindPopup("Nome: <b>" + vg.name + "</b><br/>Ordem: <b>"+ vg.order + "</b><br/>Tipo: <b>" 
        + vg.type + "</b><br/>Altitude: <b>" + vg.altitude + "</b><br/>Latitude:<b> " 
        + vg.latitude + "</b><br/>Longitude:<b> " + vg.longitude + "</b><br/><br/>" + 
        '<FORM ID="' + vg.type + '"> <INPUT TYPE="button" VALUE="Mesmo Tipo" ONCLICK="showVgsOfThisType(form.id)"></FORM>'
		+ "</b><br/>" +'<FORM ID="' + vg.latitude +","+ vg.longitude +'"> <INPUT TYPE="button" VALUE="Street view" ONCLICK="showStreetView(form.id)"></FORM>')
        .bindTooltip(vg.name);}
        
        return marker;
	}

	addClickHandler(handler) {
        let m = this.lmap;
		function handler2(e) {
            
			functionsToRemoveLayers();
	   		
			return handler(e).openOn(m);
        }
		return this.lmap.on('click', handler2);
	}

	addCircle(pos, radius, popup) {
		let circle =
			L.circle(pos,
				radius,
				{color: 'red', fillColor: 'pink', fillOpacity: 0.4}
			);
		circle.addTo(this.lmap);
		if( popup != "" )
			circle.bindPopup(popup);
		return circle;
    }

}


/* FUNCTIONS for HTML */

function onLoad()
{
	
	for (let i = 0; i < VG_ORDERS.length; i++) {
		layers_by_orders[i] = L.layerGroup([]);
	}
	
	for (let i = 0; i < VG_ORDERS.length; i++) {
		vgs_by_orders[i] = new Array();
	}
	
	for (let i = 0; i < VG_ORDERS.length; i++) {
		layers_circles[i] = L.layerGroup([]);
	}
	for (let i = 0; i < VG_ORDERS.length; i++) {
		layers_types[i] = L.layerGroup([]);
	}

	totalclusterMarkers = L.markerClusterGroup();

	totalCirclesclusterMarkers = L.markerClusterGroup();

	totalTypesCircles = L.markerClusterGroup();

	for (let i = 0; i < VG_ORDERS.length; i++) {
		layers_under30km[i] = L.layerGroup([]);
	}


	circlesWithInUnder30km =  L.markerClusterGroup();
	map = new Map(MAP_CENTRE, 12);
	map.addCircle(MAP_CENTRE, 100, "FCT/UNL");
	checkboxUpdate();
}

function checkboxUpdate(){
	let checkBoxV = new Array(VG_ORDERS.length);
	for(let i = 0; i < VG_ORDERS.length ;i++){
		checkBoxV[i] = document.getElementById(VG_ORDERS[i]);
	}
	for(let i = 0; i < VG_ORDERS.length ;i++){
		if(checkBoxV[i].checked){
			verificationsForCheckBox(i);
		}
		else{
			verificationsForUnCheckedBox(i);
			
				ordersStats[i] = 0;

		}
	}
	totalVis = 0;
	for(let i = 0; i < VG_ORDERS.length ;i++){
		var aux = ordersStats[i];
		document.getElementById("totalOrder"+ (i+1)).innerHTML = aux;
		totalVis += aux;
	}
	document.getElementById("totalVis").innerHTML = totalVis;
	document.getElementById("totalNVis").innerHTML = totalNVis;

	functionsAddingsToMap();
}

function validationVGS(){
    let wordToAlert = "";
    for(let f=0; f < vgs_by_orders.length; f++)
     for(let i=0; i < vgs_by_orders[f].length; i++)
        if(!vgs_by_orders[f][i].isThisValid())
         wordToAlert = wordToAlert + " \n " + vgs_by_orders[f][i].name;
         alert(wordToAlert);
}

function putCircles(){
    areThereCircles = true;
    let checkBoxV = new Array(VG_ORDERS.length);
	for(let i = 0; i < VG_ORDERS.length ;i++){
        checkBoxV[i] = document.getElementById(VG_ORDERS[i]);
        if(checkBoxV[i].checked){
             totalCirclesclusterMarkers.addLayers(layers_circles[i].getLayers());
		}
    }
	totalCirclesclusterMarkers.addTo(map.lmap);
}
function showVgsOfThisType(type){
	areThereTypesCircles = true;
	if(type != "NÃO DISPONÍVEL"){
	if(last_type != type){
		for (let i = 0; i < VG_ORDERS.length; i++) {
					totalTypesCircles.clearLayers();

			layers_types[i] = L.layerGroup([]);
		}

		for(let f=0; f < vgs_by_orders.length; f++){
			for(let i=0; i < vgs_by_orders[f].length; i++){
				if(vgs_by_orders[f][i].getType() == type){
					layers_types[f].addLayer(vgs_by_orders[f][i].type_circle());
				}
			}
		}
	}
	last_type = type;
    let checkBoxV = new Array(VG_ORDERS.length);
	for(let i = 0; i < VG_ORDERS.length ;i++){
        checkBoxV[i] = document.getElementById(VG_ORDERS[i]);
        if(checkBoxV[i].checked){
				totalTypesCircles.addLayers(layers_types[i].getLayers());
		}
    }
	totalTypesCircles.addTo(map.lmap);
}
}

function showStreetView(coord){
	window.open("http://maps.google.com/maps?q=&layer=c&cbll=" + coord,'_blank');
}

function putCirclesWithIn30km(vgs){
	circlesWithInUnder30km.clearLayers();
	for (let i = 0; i < VG_ORDERS.length; i++) {
		layers_under30km[i].clearLayers();}
	areThereCircles30km = true;
	let vgsi;
	for(let i = 0; i < VG_ORDERS.length ;i++){
		for(let f=0; f < vgs_by_orders[i].length; f++)
			if(vgs_by_orders[i][f].name == vgs)	vgsi = vgs_by_orders[i][f];}

	for(let i = 0; i < VG_ORDERS.length ;i++){
		for(let f=0; f < vgs_by_orders[i].length; f++){
			if(vgsi.addVG30km(vgs_by_orders[i][f])){
				circlesWithInUnder30km.addLayer(vgs_by_orders[i][f].put30km_circle());
				layers_under30km[i].addLayer(vgs_by_orders[i][f].put30km_circle());
			}
		}	
	}		
	checkboxUpdate();

}

function verificationsForCheckBox(i){
	totalclusterMarkers.addLayers(layers_by_orders[i].getLayers());
            ordersStats[i] = layers_by_orders[i].getLayers().length;
            if(areThereCircles)
				totalCirclesclusterMarkers.addLayers(layers_circles[i].getLayers());
			if(areThereTypesCircles)
				for(let g=0; g < layers_types[i].getLayers().length; g++)
				if(layers_types[i].getLayers()[g] != undefined)
				totalTypesCircles.addLayer(layers_types[i].getLayers()[g]);
}

function verificationsForUnCheckedBox(i){
				
				totalTypesCircles.removeLayers(layers_types[i].getLayers());
				totalCirclesclusterMarkers.removeLayers(layers_circles[i].getLayers());
				totalclusterMarkers.removeLayers(layers_by_orders[i].getLayers());
				circlesWithInUnder30km.clearLayers();
}

function functionsAddingsToMap(){
	totalclusterMarkers.addTo(map.lmap);
	totalTypesCircles.addTo(map.lmap);
	totalCirclesclusterMarkers.addTo(map.lmap);
	circlesWithInUnder30km.addTo(map.lmap);
}

function functionsToRemoveLayers(){
			areThereCircles = false;
			areThereTypesCircles = false;
			areThereCircles30km = false;
			for (let i = 0; i < VG_ORDERS.length; i++) {
				layers_under30km[i].clearLayers();}
            	totalTypesCircles.removeFrom(map.lmap);
				totalTypesCircles.removeLayers(totalTypesCircles.getLayers());
				totalCirclesclusterMarkers.removeFrom(map.lmap);
				circlesWithInUnder30km.removeFrom(map.lmap);
				circlesWithInUnder30km.clearLayers();
				totalCirclesclusterMarkers.removeLayers(totalCirclesclusterMarkers.getLayers());
}