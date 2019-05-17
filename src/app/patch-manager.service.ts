import { Injectable, QueryList } from '@angular/core';

import {Pt, Group, Rectangle} from "pts"


export class Patch{

	private id: number;
	public rect: Group;

	private patchManager: PatchManagerService;

	constructor( id: number, rect: Group, patchManager: PatchManagerService){
		this.rect = rect;
		this.patchManager = patchManager;
		
	}

	getWidth(): number{
		return this.rect[1][0] - this.rect[0][0];
	}
	
	getHeight(): number{
		return this.rect[1][1] - this.rect[0][1];
	}

	getImageData(): ImageData {
		return this.patchManager.getImage().getImageData(this.rect[0][0], this.rect[0][1],this.getWidth(),this.getHeight())
	}
	
}

@Injectable({
  providedIn: 'root'
})
export class PatchManagerService {

  public patches: Patch[] = [];

  private id: number = 0;

	private currentImage: HTMLCanvasElement;

  constructor() { }


  public setImage(image:HTMLCanvasElement){
  	this.currentImage = image;
  }

  public addPatch(rect: Group): number {

  	var patch:Patch = new Patch(this.id, rect, this);  
  	this.patches.push(patch)

  	this.id++;

  	return this.id - 1;

  };

  public getRectangles():Group[]{
  	return this.patches.map(patch => patch.rect)
  }

  public getImage(): CanvasRenderingContext2D{
  	return this.currentImage.getContext('2d')
  }




}
