/**
 *
 * Bunny Mark - using Point based sprite rendering
 *
 */



// created while the data is loading (preloader)
function pbBunnyPointDemo( docId )
{
	console.log( "pbBunnyPointDemo c'tor entry" );

	var _this = this;

	this.docId = docId;

	this.fps60 = 0;
	this.numSprites = 0;

	// dat.GUI controlled variables and callbacks
	this.numCtrl = gui.add(this, "numSprites").min(0).max(MAX_SPRITES).step(250).listen();
	this.numCtrl.onFinishChange(function(value) { if (!value) _this.numSprites = 0; _this.restart(); });

	// create loader with callback when all items have finished loading
	this.loader = new pbLoader( this.allLoaded, this );
	this.spriteImg = this.loader.loadImage( "bunny", "../img/bunny_32x32.png" );

	console.log( "pbBunnyPointDemo c'tor exit" );
}


pbBunnyPointDemo.prototype.allLoaded = function()
{
	console.log( "pbBunnyPointDemo.allLoaded" );

	this.renderer = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbBunnyPointDemo.prototype.create = function()
{
	console.log("pbBunnyPointDemo.create");

	this.list = [];

	// create a pbSimpleLayer to display the bunnies rapidly with minimum overhead
	this.layer = new pbSimpleLayer();
	this.layer.create(null, this.renderer, 0, 0, null);

	// set the pbSimpleLayer to call the GL_POINT style sprite drawing function and a data preparation function for XY coordinates only
	this.layer.setDrawingFunctions( this.layer.prepareXY, this.layer.drawPoint );

	rootLayer.addChild(this.layer);
};


pbBunnyPointDemo.prototype.destroy = function()
{
	console.log("pbBunnyPointDemo.destroy");

	gui.remove(this.numCtrl);
	this.list = null;

	this.layer.destroy();
	this.layer = null;

	if (this.surface)
		this.surface.destroy();
	this.surface = null;

	if (this.renderer)
		this.renderer.destroy();
	this.renderer = null;
};


pbBunnyPointDemo.prototype.restart = function()
{
	console.log("pbBunnyPointDemo.restart");
	
	this.destroy();
	this.create();
};


pbBunnyPointDemo.prototype.addSprites = function(num)
{
	// create animation data and set destination for movement
	if (!this.surface)
	{
		var imageData = this.loader.getFile( this.spriteImg );
		this.surface = new pbSurface();
		this.surface.create(0, 0, 1, 1, imageData);
		this.surface.isNPOT = true;
		
		// tell the layer what surface it will draw from
		this.layer.surface = this.surface;
	}

	for(var i = 0; i < num; i++)
	{
		var img = new imageClass();
		img.create(this.surface, 0, 0.5, 1.0);
		img.isParticle = true;			// use fast batch drawing, object doesn't rotate

		var spr = new pbTransformObject();
		spr.create(img, 13, 37, 1.0, 0, 1.0, 1.0);
		this.layer.addChild(spr);

		this.list.push( { sprite:spr, vx:Math.random() * 10, vy:(Math.random() * 10) - 5 });
	}

	this.numSprites = this.list.length;
};


pbBunnyPointDemo.prototype.removeSprites = function(num)
{
	for( var i = 0; i < num; i++ )
	{
		if (this.list.length > 0)
		{
			var obj = this.list[this.list.length - 1];
			obj.sprite.destroy();
		}

		this.list.pop();
	}
	this.numSprites = this.list.length;
};


pbBunnyPointDemo.prototype.update = function()
{
	var i = this.list.length;
	while(i--)
	{
		var obj = this.list[i];
		var spr = obj.sprite;
		spr.x += obj.vx;
		spr.y += obj.vy;
		obj.vy += 0.75;
		if (spr.x < 13)
		{
			spr.x = 13;
			obj.vx = -obj.vx;
		}
		else if (spr.x > pbRenderer.width - 13)
		{
			spr.x = pbRenderer.width - 13;
			obj.vx = -obj.vx;
		}
		if (spr.y >= pbRenderer.height)
		{
			spr.y = pbRenderer.height;
			obj.vy *= - 0.85;
			if (Math.random() > 0.5)
			{
				obj.vy -= Math.random() * 6;
			}			
		}
		if (spr.y < 0)
		{
			spr.y = 0;
			obj.vy = 0;
		}
	}

	if (fps >= 59)
	{
		// don't add more until the fps has been at 60 for one second
		if (this.fps60++ > 60 && fps >= 60)
			// add more with a gradually increasing amount as the fps stays at 60
	 		this.addSprites(Math.min(this.fps60, 200));
	}
	else
	{
		// fps dropped a little, reset counter
		this.fps60 = 0;
	}

	// don't remove bunnies, we need to see if the GC is hitting
	// if (fps > 0 && fps <= 57 && (pbPhaserRender.frameCount & 15) === 0)
	// {
	// 	// fps is too low, remove sprites... go faster if the fps is lower
	//  	this.removeSprites((58 - fps) * 16);
	// }
};

