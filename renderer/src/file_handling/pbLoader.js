/**
 *
 * Resource loader.
 *
 * Pete Baron 8/12/2014
 * 
 */


// global
// TODO: improve this, globals are nasty especially when they're embedded in a source file like this
var textures = null;


function pbLoader(callback, context)
{
	console.log("pbLoader c'tor entry");

	this.queue = [];
	this.files = [];

	this.callback = callback;
	this.context = context;

	textures = new pbDictionary();
	textures.create();

	console.log("pbLoader c'tor exit");
}


pbLoader.prototype.loadFile = function(filename, responseType)
{
	console.log("pbLoader.loadFile ", filename);

	var index = this.files.length;
	var _this = this;
	
	this.files[index] = new XMLHttpRequest();
	this.files[index].open("GET", filename, true);
	if (responseType === undefined)
		this.files[index].responseType = 'text';
	else
		this.files[index].responseType = responseType;
	this.files[index].onload = function(evt) {
		_this.loaded.call(_this, evt, "text", index);
	};

	this.queue.push(this.files[index]);
	this.files[index].send();

	return index;
};


pbLoader.prototype.loadImage = function(key, filename, cellWide, cellHigh, cellsWide, cellsHigh)
{
	if (cellWide === undefined) cellWide = 0;
	if (cellHigh === undefined) cellHigh = 0;
	if (cellsWide === undefined) cellsWide = 1;
	if (cellsHigh === undefined) cellsHigh = 1;

	console.log("pbLoader.loadImage ", key, filename, cellWide + "x" + cellHigh, cellsWide + "x" + cellsHigh);

	if (textures.exists(key))
	{
		console.log("pbLoader.loadImage attempting to reuse an existing key! " + key + " for " + filename);
		return -1;
	}

	var index = this.files.length;
	
	var image = this.files[index] = new Image();
	// attach all the sprite sheet details to the new image to make them available in the callback after the image has loaded
	image.key = key;
	image.cellWide = cellWide;
	image.cellHigh = cellHigh;
	image.cellsWide = cellsWide;
	image.cellsHigh = cellsHigh;
	// set up the callback for load completion
	image.onload = this.makeLoadHandler(this, index);
	image.src = filename;
	// add this image to a queue so the load complete callback can tell when all images have been loaded
	this.queue.push(image);

	return index;
};


pbLoader.prototype.makeLoadHandler = function(context, index)
{
	return function(evt) {
		context.loaded.call(context, evt, "image", index);
	};
};


pbLoader.prototype.loaded = function(evt, type, index)
{
	console.log("pbLoader.loaded");

	var i = this.queue.indexOf(evt.target);
	if (i != -1)
	{
		this.queue.splice(i, 1);
	}

	if (type == "image")
	{
		var image = evt.target;
		var surface = new pbSurface();
		surface.create(image.cellWide, image.cellHigh, image.cellsWide, image.cellsHigh, image);
		// add the Image and the surface to the textures dictionary referenced by 'key'
		textures.add(image.key, { imageData: image, surface: surface });
	}

	// loaded all files so the queue is now empty?
	if (this.queue.length === 0)
		this.callback.call(this.context);
};


pbLoader.prototype.getFile = function(_index)
{
	return this.files[_index];
};


