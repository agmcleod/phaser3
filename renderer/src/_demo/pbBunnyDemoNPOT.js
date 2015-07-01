/**
 *
 * Bunny Mark
 *
 */



// created while the data is loading (preloader)
function pbBunnyDemoNPOT( docId )
{
	console.log( "pbBunnyDemoNPOT c'tor entry" );

	var _this = this;

	this.fps60 = 0;
	this.numSprites = 0;

	this.phaserRender = new pbPhaserRender( docId );
	this.phaserRender.create( useRenderer, this.create, this.update, this );
	this.spriteImg = pbPhaserRender.loader.loadImage( "bunny", "../img/bunny.png" );

	console.log( "pbBunnyDemoNPOT c'tor exit" );
}


pbBunnyDemoNPOT.prototype.allLoaded = function()
{
	console.log( "pbBunnyDemoNPOT.allLoaded" );

	this.phaserRender = new pbRenderer( useRenderer, this.docId, this.create, this.update, this );
};


pbBunnyDemoNPOT.prototype.create = function()
{
	console.log("pbBunnyDemoNPOT.create");

	this.list = [];

	this.layer = new pbSimpleLayer();
	this.layer.create(null, this.phaserRender, 0, 0, null);
	rootLayer.addChild(this.layer);
};


pbBunnyDemoNPOT.prototype.destroy = function()
{
	console.log("pbBunnyDemoNPOT.destroy");

	this.list = null;

	if (this.surface)
		this.surface.destroy();
	this.surface = null;

	if (this.phaserRender)
		this.phaserRender.destroy();
	this.phaserRender = null;
};


pbBunnyDemoNPOT.prototype.restart = function()
{
	console.log("pbBunnyDemoNPOT.restart");
	
	this.destroy();
	this.create();
};


pbBunnyDemoNPOT.prototype.addSprites = function(num)
{
	// create animation data and set destination for movement
	if (!this.surface)
	{
		var imageData = pbPhaserRender.loader.getFile( this.spriteImg );
		this.surface = new pbSurface();
		// _imageData, _rttTexture, _rttTextureRegister
		this.surface.createSingle(imageData);
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


pbBunnyDemoNPOT.prototype.removeSprites = function(num)
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


pbBunnyDemoNPOT.prototype.update = function()
{
	// debug sprite count
	sprCountDbg += this.list.length;

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
		else if (spr.x > pbPhaserRender.width - 13)
		{
			spr.x = pbPhaserRender.width - 13;
			obj.vx = -obj.vx;
		}
		if (spr.y >= pbPhaserRender.height)
		{
			spr.y = pbPhaserRender.height;
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

	if (fps >= 60)
	{
		// don't add more until the fps has been at 60 for one second
		if (this.fps60++ > 60)
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

