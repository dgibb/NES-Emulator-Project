//David Gibb

var ppu={

registers:[0,0,0],

//0x2000
nmiEnable:0,
m_s:0,
spriteSize:0,
patternTableOffset:0,
spriteTableOffset:0x1000,
incrementMode:1,
nametableOffset:0x2000,

//0x2001
bgr:0,
spriteEnable:0,
bgEnable:1,
spriteLeftColumnEnable:0,
bgLeftColumnEnable:0,
greyScale:0,

//0x2002
sprite0Hit:0,
spriteOverflow:0,

//0x2003
oamAddr:0,

//0x2005
scroll:[0,0],
xy:0,

//0x2006
vRamAddr:0,

//0x2014
oamDMA:0,

//Frame Rendering
bgTileBuffer:[0,0,0,0,0,0],
bgAttributeBuffer:[0,0,0],
tileBufferOffset:0,
palletteBuffer:[0,0],
spriteShiftReg:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
attributeLatch:[0,0,0,0,0,0,0,0],
spriteX:[0,0,0,0,0,0,0,0],
canvasOffset:0,
tileX:0,
tileY:0,
nametableByte:0,
fineScrollX:0,
fineScrollY:0,
spriteTileOffset:0,

//Misc
nametableMirroring:0, //see mirroring table at bottom
graphicsDebug:0,
spriteNumBuf:[0,0,0,0,0,0,0,0],

//FSM
scanline:261,
cycle:0,
mode:0,

//bg rendering

step:function(){



	if(ppu.scanline<240){
		switch(ppu.mode){
			case 0:
				ppu.mode=1;
				ppu.calculateFineScroll();
			break;

		case 1:

		if ((ppu.fineScrollX%8)===0){ppu.shiftRegisters();}

			switch (ppu.cycle&0x7){

				case 1:
					ppu.fetchNTByte();
				break;

				case 3:
					ppu.fetchATByte();
				break;

				case 5:
					ppu.fetchTBLow();
				break;

				case 7:
					ppu.fetchTBHigh();
				break;
				}
				ppu.renderPixel();
				if (ppu.cycle===256){ppu.mode=2;}
			break;

			case 2:
				switch (ppu.cycle&0x7){
					case 5:
						if (ppu.spritesFound<8){ppu.fetchSpriteLow();}
					break;

					case 7:
							if (ppu.spritesFound<8)ppu.fetchSpriteHigh();
					break;
				}
				if (ppu.cycle===320){ppu.mode=3}
			break;

			case 3:
				switch (ppu.cycle&0x7){

					case 1:
						ppu.fetchNextLineNTByte();
						ppu.shiftRegisters();
					break;

					case 3:
						ppu.fetchATByte();
					break;

					case 5:
						ppu.fetchNextTBLow();
					break;

					case 7:
						ppu.fetchNextTBHigh();
					break;
					}
					if (ppu.cycle===336){ppu.mode=4}
				break; //does nothing yet

			case 4:
				if (ppu.cycle===340){ppu.mode=0;
					 ppu.cycle=-1;
					 ppu.scanline=ppu.scanline+1
					 ppu.fineScrollY=(ppu.fineScrollY+1)%8;
				 }
				break;
		}
		ppu.cycle++;

		}else{

		if (ppu.cycle===340){
			 ppu.mode=0;
			 ppu.cycle=-1;
			 ppu.scanline=(ppu.scanline+1)%262;
			 ppu.fineScrollY=(ppu.fineScrollY+1)%8;
		 }
		if (ppu.scanline===241&&ppu.cycle===1){
			ppu.setVBlankFlag();
			if (ppu.nmiEnable){
				memory.writeWord((cpu.sp|0x100)-1, cpu.pc);
				cpu.sp-=2;
				memory.writeByte(cpu.sp|0x100, cpu.sr|0x30);
				cpu.sp-=1;
				cpu.pc=memory.readWord(memory.nmiVector);
				debug.callStack.push(cpu.pc.toString(16))
			}
			screen.putImageData(pixData,0,0);
		}
		if (ppu.scanline===261&&ppu.cycle===1){
			ppu.registers[2]&=0x1F;
			ppu.canvasOffset=0;
		}
		ppu.cycle++;
	}
},

calculateFineScroll:function(){
	ppu.fineScrollX=(ppu.scroll[0]+ppu.cycle)%8;
	ppu.fineScrollY=(ppu.scroll[1]+ppu.scanline)%8;
},

fetchNTByte:function(){					//actually fetches patternTable address;

	var offsetX;
	var offsetY;

	switch (ppu.nametableMirroring){

		case 0:
		console.log('mirroring mode 0 not yet supported');
		break;

		case 1:
		console.log('mirroring mode 1 not yet supported');
		break;

		case 2: //horizontal mirroring
		ppu.tileY=(Math.floor((ppu.scroll[1]+ppu.scanline)/8));
		ppu.tileY%=60;
		ppu.tileX=(Math.floor((ppu.scroll[0]+ppu.cycle+15)/8));
		ppu.tileX%=32;
		offsetY=ppu.tileY*32;;
		if(ppu.tileY>=30){offsetY+=0x40;}
		offsetX=ppu.tileX;
		break;

		case 3: //vertical mirroring
		ppu.tileY=(Math.floor((ppu.scroll[1]+ppu.scanline)/8));
		ppu.tileY%=30;
		ppu.tileX=(Math.floor((ppu.scroll[0]+ppu.cycle+15)/8));
		ppu.tileX%=64;
		offsetY=ppu.tileY*32;
		if(ppu.tileX>=32){offsetX=ppu.tileX+1024;}else{offsetX=ppu.tileX}
		break;

		case 4:
		console.log('mirroring mode 4 not yet supported');
		break;

		case 5:
		console.log('mirroring mode 5 not yet supported');
		break;

		case 6:
		console.log('mirroring mode 6 not yet supported');
		break;

		case 7:
		console.log('mirroring mode 7 not yet supported');
		break;
	}

	ppu.nametableByte=ppu.readVRam(ppu.nametableOffset+offsetX+offsetY);//nametable Byte
	//	if (ppu.graphicsDebug)console.log('offsetX, offsetY, nametableOffset, nametableByte:', offsetX.toString(16), offsetY.toString(16), ppu.nametableOffset.toString(16))
	ppu.nametableByte=(ppu.nametableByte<<4)+ppu.patternTableOffset;//tile pattern address
//	if (ppu.graphicsDebug)console.log('tileX, tileY, nametableByte:', ppu.tileX, ppu.tileY, ppu.nametableByte.toString(16))
	},

fetchNextLineNTByte:function(){

			var offsetX;
			var offsetY;

			switch (ppu.nametableMirroring){

				case 0:
				console.log('mirroring mode 0 not yet supported');
				break;

				case 1:
				console.log('mirroring mode 1 not yet supported');
				break;

				case 2: //horizontal mirroring
				ppu.tileY=(Math.floor((ppu.scroll[1]+ppu.scanline+1)/8));
				ppu.tileY%=60;
				ppu.tileX=ppu.scroll[0];
				if (ppu.cycle>321){ppu.tileX+=8;}
				ppu.tileX=Math.floor(ppu.tileX/8);
				ppu.tileX%=32;
				offsetY=ppu.tileY*32;;
				if(ppu.tileY>=30){offsetY+=0x40;}
				offsetX=ppu.tileX;
				break;

				case 3: //vertical mirroring
				ppu.tileY=(Math.floor((ppu.scroll[1]+ppu.scanline+1)/8));
				ppu.tileY%=30;
				ppu.tileX=(Math.floor((ppu.scroll[0]/8)));
				ppu.tileX%=64;
				offsetY=ppu.tileY*32;
				if(ppu.tileX>=32){offsetX=ppu.tileX+1024;}else{offsetX=ppu.tileX}
				break;

				case 4:
				console.log('mirroring mode 4 not yet supported');
				break;

				case 5:
				console.log('mirroring mode 5 not yet supported');
				break;

				case 6:
				console.log('mirroring mode 6 not yet supported');
				break;

				case 7:
				console.log('mirroring mode 7 not yet supported');
				break;
			}

			ppu.nametableByte=ppu.readVRam(ppu.nametableOffset+offsetX+offsetY);//nametable Byte
				//if (ppu.graphicsDebug)console.log('offsetX, offsetY, nametableOffset, nametableByte:', offsetX.toString(16), offsetY.toString(16), ppu.nametableOffset.toString(16))
			ppu.nametableByte=(ppu.nametableByte<<4)+ppu.patternTableOffset;//tile pattern address
			if (ppu.graphicsDebug)console.log('tileX, tileY, nametableByte:', ppu.tileX, ppu.tileY, ppu.nametableByte.toString(16))
			//ppu.shiftRegisters();
	},

fetchATByte:function(){					//acually fetches 2 bit bg pallete

	var attributeTableOffset=((ppu.tileX>=32)||(ppu.tileY>=30))?0x27C0:0x23C0;
	var offsetX=Math.floor((ppu.tileX%32)/4);
	var offsetY=Math.floor((ppu.tileY%32)/4)*8;
	var attByte = ppu.readVRam(attributeTableOffset+offsetX+offsetY);
	attByte>>=((ppu.tileY/2)&0x01)?4:0;
	attByte>>=((ppu.tileX/2)&0x01)?2:0;
	attByte&=0x03;
	ppu.bgAttributeBuffer[0]=attByte;
},

fetchTBLow:function(){
	ppu.bgTileBuffer[0]=ppu.readVRam(ppu.nametableByte+ppu.fineScrollY);
},

fetchTBHigh:function(){
	ppu.bgTileBuffer[1]=ppu.readVRam(ppu.nametableByte+8+ppu.fineScrollY);
	//if (ppu.graphicsDebug)console.log(ppu.bgTileBuffer)
},

fetchNextTBLow:function(){
	ppu.bgTileBuffer[0]=ppu.readVRam(ppu.nametableByte+((ppu.fineScrollY+1)%8));
},

fetchNextTBHigh:function(){
	ppu.bgTileBuffer[1]=ppu.readVRam(ppu.nametableByte+8+((ppu.fineScrollY+1)%8));
	//if (ppu.graphicsDebug)console.log(ppu.bgTileBuffer)
},

shiftRegisters:function(){
	ppu.bgTileBuffer[4]=ppu.bgTileBuffer[2];
	ppu.bgTileBuffer[5]=ppu.bgTileBuffer[3];
	ppu.bgTileBuffer[2]=ppu.bgTileBuffer[0];
	ppu.bgTileBuffer[3]=ppu.bgTileBuffer[1];
	ppu.bgAttributeBuffer[2]=ppu.bgAttributeBuffer[1];
	ppu.bgAttributeBuffer[1]=ppu.bgAttributeBuffer[0];
},

fetchSpriteLow:function(){
	ppu.spriteTileOffset=oamBuf[ppu.spritesFound][1]*16;

	var offY=((ppu.scanline+1)-oamBuf[ppu.spritesFound][0])
	if(oamBuf[ppu.spritesFound][2]&0x80){
		offY=(ppu.spriteSize*8)-offY-1;
	}
	if (offY>7){offY+=8}	//Y Flip
	ppu.spriteTileOffset+=offY

	//if (ppu.graphicsDebug){console.log('Sprite:', oamBuf[ppu.spritesFound][1].toString(16), ppu.scanline, oamBuf[ppu.spritesFound][0], offY, (ppu.spriteTileOffset+ppu.spriteTableOffset).toString(16) );}

	var byte=ppu.readVRam(ppu.spriteTableOffset+ppu.spriteTileOffset);

	if (oamBuf[ppu.spritesFound][2]&0x40){byte=ppu.xFlip(byte);} //X flip

	ppu.spriteShiftReg[ppu.spritesFound][0]=byte;

	ppu.spriteTileOffset+=8;

},

fetchSpriteHigh:function(){

	var byte=ppu.readVRam(ppu.spriteTableOffset+ppu.spriteTileOffset);
	if (oamBuf[ppu.spritesFound][2]&0x40){byte=ppu.xFlip(byte);} //X flip
	ppu.spriteShiftReg[ppu.spritesFound][1]=byte;
	ppu.spritesFound++;
	ppu.spritesFound%=8;
},

renderPixel:function(){

	if(ppu.bgEnable){
		if((!ppu.bgLeftColumnEnable)&&(ppu.cycle<10)){ //bgLeftColumnDisable
			//console.log('ppu.leftColumnDisable', ppu.bgLeftColumnEnable)
			var color=bgPal[0][0];
			pixData.data[ppu.canvasOffset]=palette[color][0];
			pixData.data[ppu.canvasOffset+1]=palette[color][1];
			pixData.data[ppu.canvasOffset+2]=palette[color][2];
			ppu.canvasOffset+=4;
		}else{
		var bgPix=((ppu.bgTileBuffer[4]>>(7-ppu.fineScrollX))&0x01)?1:0;
		bgPix+=((ppu.bgTileBuffer[5]>>(7-ppu.fineScrollX))&0x01)?2:0;
		var color=bgPal[ppu.bgAttributeBuffer[2]][bgPix];
		pixData.data[ppu.canvasOffset]=palette[color][0];
		pixData.data[ppu.canvasOffset+1]=palette[color][1];
		pixData.data[ppu.canvasOffset+2]=palette[color][2];
		ppu.canvasOffset+=4;
		ppu.fineScrollX=(ppu.fineScrollX+1)%8

	//Sprite Rendering
	if(ppu.spriteEnable){
		if(!((!ppu.spriteLeftColumnEnable)&&(ppu.cycle<10))){
		for(var i=7;i>=0;i--){
			if((((ppu.cycle-1)>=ppu.spriteX[i]&&(ppu.cycle-1)<(ppu.spriteX[i]+8)))&&ppu.spriteX[i]!==0xFF){//x coord is in range
				var shift=(ppu.cycle-1)-ppu.spriteX[i];
				var pix=((ppu.spriteShiftReg[i][0]>>(7-shift))&0x01)?1:0;
				pix+=((ppu.spriteShiftReg[i][1]>>(7-shift))&0x01)?2:0;
					if(pix!==0){		//pix!=0 put image data
						if((ppu.spriteNumBuf[i]===0)&&(bgPix!==0)){
							ppu.registers[2]|=0x40;
						}
						var color=spritePal[ppu.attributeLatch[i]&0x03][pix];
						pixData.data[ppu.canvasOffset-4]=palette[color][0];
						pixData.data[ppu.canvasOffset-3]=palette[color][1];
						pixData.data[ppu.canvasOffset-2]=palette[color][2];
					}
					}
				}
			}
		}
	}
	}else{
		pixData.data[ppu.canvasOffset]=palette[0xF][0];
		pixData.data[ppu.canvasOffset+1]=palette[0xF][1];
		pixData.data[ppu.canvasOffset+2]=palette[0xF][2];
		ppu.canvasOffset+=4;
	}
},

setVBlankFlag:function(){
	ppu.registers[2]|=0x80;
},

xFlip:function(byte){

	var newByte=0;
	newByte|=(byte&0x80)?0x01:0;
	newByte|=(byte&0x40)?0x02:0;
	newByte|=(byte&0x20)?0x04:0;
	newByte|=(byte&0x10)?0x08:0;
	newByte|=(byte&0x08)?0x10:0;
	newByte|=(byte&0x04)?0x20:0;
	newByte|=(byte&0x02)?0x40:0;
	newByte|=(byte&0x01)?0x80:0;
	return newByte;
},


//sprite Eval

srMode:0,
srCase2Mode:1,
spritesFound:0,
oamPtr:0,
spriteTransfer:0,


spriteEval:function(){

	if(ppu.scanline<240){
		switch(ppu.srMode){
			case 0:
				ppu.srMode=1;
			break;

			case 1:		//clearing secondary oam
			if(!(ppu.cycle%2)){
				if (ppu.cycle<64){
					var addr=(ppu.cycle/2)-1;
					oamBuf[Math.floor(addr/4)][addr%4]=0xFF;
				}else{
					oamBuf[7][3]=0xFF;
					ppu.srMode=2;
				}
			}
			break;

			case 2: //sprite Evaluation

				switch(ppu.srCase2Mode){

					case 1:	//loading and checking each sprite
						if(!(ppu.cycle%2)){
							oamBuf[ppu.spritesFound][0]=oam[ppu.oamPtr][0];
							oamBuf[ppu.spritesFound][5]=ppu.oamPtr;
							if (((ppu.scanline)>=oamBuf[ppu.spritesFound][0])&&((ppu.scanline)<(oamBuf[ppu.spritesFound][0]+(ppu.spriteSize*8)))){
								oamBuf[ppu.spritesFound][0]++;
								ppu.srCase2Mode=2;
								ppu.spriteTransfer=1;
							}else {
							ppu.oamPtr++;
								if(ppu.oamPtr===64){
									ppu.srCase2Mode=3;
									ppu.oamPtr=0;
									ppu.spritesFound=0;
								}
							}
						}
					break;

					case 2://spriteHit, transfers bytes 1,2,3
						if(!(ppu.cycle%2)){
							if(ppu.spriteTransfer<3){
								oamBuf[ppu.spritesFound][ppu.spriteTransfer]=oam[ppu.oamPtr][ppu.spriteTransfer];
								if((ppu.spriteTransfer===1)&&(ppu.spriteSize===2)){oamBuf[ppu.spritesFound][1]-=1}
								ppu.spriteTransfer++;
							}else{
								oamBuf[ppu.spritesFound][3]=oam[ppu.oamPtr][3];
								//if(ppu.graphicsDebug){console.log(ppu.scanline+1, ppu.spritesFound, ppu.oamPtr, oamBuf[ppu.spritesFound][1].toString(16))}
								ppu.spriteTransfer=0;
								ppu.oamPtr++;
								ppu.spritesFound++;
								ppu.srCase2Mode=1;
								if(ppu.oamPtr===64||ppu.spritesFound===8){
									ppu.srCase2Mode=3;
									ppu.oamPtr=0;
									ppu.spritesFound=0;

								}
							}
						}
					break;

					case 3:
					oamBufPrev=oamBuf;
					if (ppu.cycle===256){
						ppu.srCase2Mode=1;
						ppu.srMode=3;
						ppu.oamPtr=0;
						ppu.spritesFound=0;
						ppu.spriteTransfer=0;
					}
					break;
				}
			break;

			case 3:
				switch (ppu.cycle&0x7){

					case 1:
						ppu.attributeLatch[ppu.spritesFound]=oamBuf[ppu.spritesFound][2];
						ppu.spriteNumBuf[ppu.spritesFound]=oamBuf[ppu.spritesFound][5];
					break;

					case 3:
						ppu.spriteX[ppu.spritesFound]=oamBuf[ppu.spritesFound][3];
					break;
				}

				if (ppu.cycle===320){
					ppu.spritesFound=0;
					ppu.srMode=4;
				}

			break;

			case 4:

				if(ppu.cycle===340){ppu.srMode=0}
			break;
		}
	}
},

//memory access

readByte: function(addr){

	switch (addr%8){

    case 0:
    	return ppu.registers[0]
    break;

    case 1:
      return ppu.registers[1]
    break;

    case 2:
      return ppu.registers[2];
					ppu.registers[2]&=0x7F;
    break;

		case 3:
      return ppu.oamAddr;
    break;

		case 4:
			return oam[Math.floor(ppu.oamAddr/4)][ppu.oamAddr];
		break;

		case 5:
			return ppu.scroll[ppu.xy];
		break;

		case 6:
			return ppu.vRamAddr&0xFF;
		break;

		case 7:
			return ppu.readVRam(ppu.vRamAddr);
			 ppu.vRamAddr+=ppu.incrementMode;
		break;
	}
},

writeByte: function(addr, data){
	switch (addr%8){

		case 0:
			 ppu.registers[0]=data;
			 if (data&0x80){ppu.nmiEnable=1;}else{ppu.nmiEnable=0}
			 if (data&0x40){ppu.m_s=1;}else{ppu.m_s=0}
			 if (data&0x20){ppu.spriteSize=2;}else{ppu.spriteSize=1}
			 ppu.patternTableOffset=(data&0x10)<<8;
			 ppu.spriteTableOffset=(data&0x08)<<9;
			 if (data&0x04){ppu.incrementMode=32;}else{ppu.incrementMode=1;}
			 switch(data&0x03){
				 case 0:
				 	ppu.scroll[0]&=0xFF;
					ppu.scroll[1]&=0xFF;
				 break;

				 case 1:
				 	ppu.scroll[0]|=0x100;
					ppu.scroll[1]&=0xFF;
				 break;

				 case 2:
				  ppu.scroll[0]&=0xFF;
					ppu.scroll[1]|=0x100;
				 break;

				 case 3:
				 	ppu.scroll[0]|=0x100;
					ppu.scroll[1]|=0x100;
				 break;
			 }
		break;

		case 1:
		//console.log(data.toString(2));
			ppu.registers[1]=data;
			ppu.bgr=(data>>5)
			ppu.spriteEnable=(data&0x10)?1:0;
			ppu.bgEnable=(data&0x08)?1:0;
			ppu.spriteLeftColumnEnable=(data&0x04)?1:0;
			ppu.bgLeftColumnEnable=(data&0x02)?1:0;
			ppu.greyScale=data&0x01;
		break;

		case 2:

		break;

		case 3:
			return ppu.oamAddr;
		break;

		case 4:
			oam[Math.floor(ppu.oamAddr/4)][ppu.oamAddr%4]=data;
		break;

		case 5:
			 ppu.scroll[ppu.xy]&=0x100;
			 ppu.scroll[ppu.xy]|=data;
			 ppu.xy=(ppu.xy+1)&0x1
		break;

		case 6:
			 ppu.vRamAddr<<=8;
			 ppu.vRamAddr|=data;
			 ppu.vRamAddr&=0xFFFF;
		break;

		case 7:
			 ppu.writeVRam(ppu.vRamAddr, data);
			 ppu.vRamAddr+=ppu.incrementMode;
		break;
	}
},

readVRam:function(addr){

	addr&=0x3FFF;

	switch(addr&0xF000){

		case 0x0000:
		case 0x1000:
			return memory.mapper.readVRam(addr)
		break;

		case 0x2000:

			switch(addr&0xF00){

				case 0x000:
				case 0x100:
				case 0x200:
				case 0x300:
					return nameTable[0][addr-0x2000];
				break;

				case 0x400:
				case 0x500:
				case 0x600:
				case 0x700:
				switch(ppu.nametableMirroring){

				case 2:
				return nameTable[1][addr-0x2400];
				break

				case 3:
				return nameTable[1][addr-0x2400];
				break;
			}
				break;

				case 0x800:
				case 0x900:
				case 0xA00:
				case 0xB00:
					switch(ppu.nametableMirroring){

					case 0:
					return nameTable[1][addr-0x2800];
					break

					case 1:
					return nameTable[0][addr-0x2800];
					break;
				}
				break;

				case 0xC00:
				case 0xD00:
				case 0xE00:
				case 0xF00:
					return nameTable[1][addr-0x2C00];
				break;

			}

		break;

		case 0x3000:

			switch(addr&0xF00){

				case 0x000:
				case 0x100:
				case 0x200:
				case 0x300:
					return nameTable[0][addr-0x3000];
				break;

				case 0x400:
				case 0x500:
				case 0x600:
				case 0x700:
				switch(ppu.nametableMirroring){

				case 0:
				return nameTable[0][addr-0x3400];
				break;

				case 1:
				return nameTable[1][addr-0x3400];
				break;
			}
				break;

				case 0x800:
				case 0x900:
				case 0xA00:
				case 0xB00:
				switch(ppu.nametableMirroring){

				case 0:
				return nameTable[1][addr-0x3800];
				break;

				case 1:
				return nameTable[0][addr-0x3800];
				break;
			}
				break;

				case 0xC00:
				case 0xD00:
				case 0xE00:
					return nameTable[1][addr-0x3C00];
				break;

				case 0xF00:
				addr=(addr-0x3F00)%0x20;
				if (addr<0xF){
					return bgPal[Math.floor(addr/4)][addr%4];
			}else{
					return spritePal[Math.floor(addr/4)-4][addr%4];
				}
			}


		break;
	}
},

writeVRam:function(addr, data){

		addr&=0x3FFF;

		switch(addr&0xF000){

			case 0x0000:
			case 0x1000:
				memory.mapper.writeVRam(addr, data)
			break;

			case 0x2000:

				switch(addr&0xF00){

					case 0x000:
					case 0x100:
					case 0x200:
					case 0x300:
						nameTable[0][addr-0x2000]=data;
					break;

					case 0x400:
					case 0x500:
					case 0x600:
					case 0x700:
					switch(ppu.nametableMirroring){

					case 2:
					 nameTable[1][addr-0x2400]=data;
					break;

					case 3:
					 nameTable[1][addr-0x2400]=data;
					break;
				}
					break;

					case 0x800:
					case 0x900:
					case 0xA00:
					case 0xB00:
						switch(ppu.nametableMirroring){

						case 2:
						 nameTable[1][addr-0x2800]=data;
						break;

						case 3:
						 nameTable[0][addr-0x2800]=data;
						break;
					}
					break;

					case 0xC00:
					case 0xD00:
					case 0xE00:
					case 0xF00:
						nameTable[1][addr-0x2C00]=data;
					break;

				}

			break;

			case 0x3000:

				switch(addr&0xF00){

					case 0x000:
					case 0x100:
					case 0x200:
					case 0x300:
						nameTable[0][addr-0x3000]=data;
					break;

					case 0x400:
					case 0x500:
					case 0x600:
					case 0x700:
					switch(ppu.nametableMirroring){

						case 2:
							nameTable[0][addr-0x3400]=data;
						break

						case 3:
							nameTable[1][addr-0x3400]=data;
						break;
						}
					break;

					case 0x800:
					case 0x900:
					case 0xA00:
					case 0xB00:
					switch(ppu.nametableMirroring){

						case 2:
							nameTable[1][addr-0x3800]=data;
						break

						case 3:
							nameTable[0][addr-0x3800]=data;
						break;
						}
					break;

					case 0xC00:
					case 0xD00:
					case 0xE00:
						return nameTable[3][addr-0x3C00];
					break;

					case 0xF00:
					addr=(addr-0x3F00)%0x20;
					if (addr<=0xF){
						if ((addr%4)===0){
							spritePal[Math.floor(addr/4)][0]=data;
						}
						bgPal[Math.floor(addr/4)][addr%4]=data;
				}else{
					if ((addr%4)===0){
						bgPal[Math.floor(addr/4)-4][0]=data;
					}
						spritePal[Math.floor(addr/4)-4][addr%4]=data;
					}
				}

			break;
	}
},

oamDMA:function(addr){
	addr<<=8;
	for (var i=0;i<0x100;i++){
		oam[Math.floor(i/4)][i%4]=memory.readByte(addr+i);
		ppu.step();
		ppu.spriteEval();
		ppu.step();
		ppu.spriteEval();
	}
},

showState:function(){
	console.log('ppu state:');
	console.log('mode:', ppu.mode);
	console.log('cycle:', ppu.cycle);
	console.log('scanline:', ppu.scanline);


},

canvasInit: function(){
	var canvas = document.getElementById('screen');
	screen = canvas.getContext('2d');
	pixData = screen.createImageData(256,240);
	for(var i=0;i<pixData.data.length;i++){
		pixData.data[i]=255;
	}
	screen.putImageData(pixData,0,0);
},

oamInit:function(){
	for(var i=0;i<64;i++){
		oam[i]=[0,0,0,0];
	}
	for(var i=0;i<8;i++){
		oamBuf[i]=[0,0,0,0,0];
	}
},

init:function(){
	ppu.canvasInit();
	ppu.oamInit();
},

customPPUTest:function(){

	//clears prgROM
	for (var i=0; i<prgRom.length; i++){
	prgRom[i]=0xEA;
	}


	memory.writeByte(0xFFEF, 0xE8);
	memory.writeByte(0xFFF0, 0xC8);
	memory.writeByte(0xFFF1, 0x8E);
	memory.writeWord(0xFFF2, 0x2005);
	memory.writeByte(0xFFF4, 0x8C);
	memory.writeWord(0xFFF5, 0x2005);
	memory.writeByte(0xFFF7, 0x4C);
	memory.writeWord(0xFFF8, 0x8000);
	memory.writeWord(0xFFFE, 0x8000);
	memory.writeWord(0xFFFC, 0x8000);
	memory.writeWord(0xFFFA, 0x8000);



	//fills nametables with tile 0
	for (var i=0; i<0x3C0; i++){
		nameTable[0][i]=0;
		nameTable[1][i]=1;
	}

	for (var i=0x3C0; i<0x400; i++){
		nameTable[0][i]=0x1B;
		nameTable[1][i]=0xE4;
	}


	//draws squares to all tiles
	for (var i=0; i<0x1000; i+=32){
		chrRom[i]=0x18;
		chrRom[i+1]=0x28;
		chrRom[i+2]=0x08;
		chrRom[i+3]=0x08;
		chrRom[i+4]=0x08;
		chrRom[i+5]=0x08;
		chrRom[i+6]=0x08;
		chrRom[i+7]=0x3E;
		chrRom[i+8]=0x18;
		chrRom[i+9]=0x28;
		chrRom[i+10]=0x08;
		chrRom[i+11]=0x08;
		chrRom[i+12]=0x08;
		chrRom[i+13]=0x08;
		chrRom[i+14]=0x08;
		chrRom[i+15]=0x3E;
		i+=16;
		chrRom[i]=0x18;
		chrRom[i+1]=0x24;
		chrRom[i+2]=0x04;
		chrRom[i+3]=0x08;
		chrRom[i+4]=0x10;
		chrRom[i+5]=0x20;
		chrRom[i+6]=0x40;
		chrRom[i+7]=0x7E;
		chrRom[i+8]=0x18;
		chrRom[i+9]=0x24;
		chrRom[i+10]=0x04;
		chrRom[i+11]=0x08;
		chrRom[i+12]=0x10;
		chrRom[i+13]=0x20;
		chrRom[i+14]=0x40;
		chrRom[i+15]=0x7E;
	}
},

};

var chrRom=[];
var nameTable=[[],[],[],[]];
var bgPal=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
var spritePal=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
var oam=[];
var oamBuf=[];

//pallete credit to NES Hacker http://www.thealmightyguru.com/Games/Hacking/Wiki/index.php/NES_Palette
palette=[
[124,124,124],
[0,0,252],
[0,0,188],
[68,40,188],

[148,0,132],
[168,0,32],
[168,16,0],
[136,20,0],

[80,48,0],
[0,120,0],
[0,104,0],
[0,88,0],

[0,64,88],
[0,0,0],
[0,0,0],
[0,0,0],

//0x10

[188,188,188],
[0,120,248],
[0,88,248],
[104,68,252],

[216,0,204],
[228,0,88],
[248,56,0],
[228,92,16],

[172,124,0],
[0,184,0],
[0,168,0],
[0,168,68],

[0,136,136],
[0,0,0],
[0,0,0],
[0,0,0],

//0x20

[248,248,248],
[60,188,252],
[104,136,252],
[152,120,248],

[248,120,248],
[248,88,152],
[248,120,88],
[252,160,68],

[248,184,0],
[184,248,24],
[88,216,84],
[88,248,152],

[0,232,216],
[120,120,120],
[0,0,0],
[0,0,0],

//0x30

[252,252,252],
[164,228,252],
[184,184,248],
[216,184,248],

[248,184,248],
[248,164,192],
[240,208,176],
[252,224,168],

[248,216,120],
[216,248,120],
[184,248,184],
[184,248,216],

[0,252,252],
[248,216,248],
[0,0,0],
[0,0,0],];


/* NAMETABLE MIRRORING

	0:1 Screen, lower Bank,
  1:1 Screen, Upper Bank
	2:vertical
	3:Horizontal
	4:4 Screen
	5:3 screen Vertical
	6:3 screen Horizontal
	7:3 screen diagonal

*/
