import { Injectable, QueryList } from '@angular/core';

import {Pt, Group, Rectangle} from "pts"
import { switchMap, takeUntil, pairwise, delay, map, flatMap } from 'rxjs/operators';
import { fromEvent, from, Observable, BehaviorSubject } from 'rxjs';

import {readFileAsDataURL, readFileAsBase64} from '@webacad/observable-file-reader';

import { Papa, PapaParseResult } from 'ngx-papaparse';

import { saveAs } from 'file-saver'


export class Patch{

	public id: number;
	public rect: Group;
	public label: number;

	public active: boolean; // true if element is highlighted

	private patchManager: PatchManagerService;

	constructor( id: number, rect: Group, patchManager: PatchManagerService){
		this.id = id
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
		console.log(this.rect[0][0], this.rect[0][1],this.getWidth(),this.getHeight())
		return this.patchManager.getImage().getImageData(this.rect[0][0], this.rect[0][1],this.getWidth(),this.getHeight())
	}

	setLabel(label:number):void {
		this.label = label;
	}

	setActive(active:boolean){
		this.active = active;
	}

	
}

@Injectable({
  providedIn: 'root'
})
export class PatchManagerService {

  public patches_: Patch[] = [];
  public patches$: BehaviorSubject<Patch[]> = new BehaviorSubject([])

  private id: number = 0;

	private currentImage: HTMLCanvasElement;

  constructor(private papa: Papa) { 
  	this.patches.subscribe((patches:Patch[]) => {
  		this.patches_ = patches
  	})
  }


  public setImage(image:HTMLCanvasElement){
  	this.currentImage = image;
  }

  public addPatch(rect: Group): Patch {

  	var patch:Patch = new Patch(this.id, rect, this);  

  	
  	let items:Patch[] = [...this.patches$.value];
		items.push(patch);
		this.patches$.next(items)

  	this.id++;

  	return patch;

  };

  public deletePatch(id:number){
  	console.log('delete')
  	let items:Patch[] = [...this.patches$.value];
		items = items.filter((item:Patch) => item.id != id);
		this.patches$.next(items)
  }

  public setPatchLabel(id: number, label:number){
  	let items:Patch[] = [...this.patches$.value];
  	items = items.map<Patch>((patch:Patch): Patch => {
  		if(patch.id == id){ patch.label = label }
  		return patch
  	})
		this.patches$.next(items)
  }

  public getRectangles():Group[]{
  	return this.patches$.value.map(patch => patch.rect)
  }

  public getImage(): CanvasRenderingContext2D{
  	return this.currentImage.getContext('2d')
  }

  private parse = (csvData):Observable<PapaParseResult> => {
      let parser$ = new Observable<PapaParseResult>(observer => {
      this.papa.parse(csvData,{
            complete: (result) => {
                console.log('Parsed: ', result);
                observer.next(result)
                observer.complete()
            }}
          )
        }) 
      return parser$ 
    }


  public initRectsFromCSV(file:File):void{
  	readFileAsBase64(file).pipe(
      map((text:string) => atob(text)),
      switchMap(this.parse)
      ).subscribe((result: PapaParseResult) => {

      let data = result.data;

      console.log('done, found '+data.length+' rects');
      console.log(data);

      for(let i = 1; i < data.length; i++ ){
      	let row = data[i]
      	
      	let bounds = row[5]
      	console.log('raw ' + bounds)
      	bounds = bounds.split(',')
      	console.log('split ' + bounds)
      	bounds = bounds.map(parseFloat)
      	console.log('parsed ' + bounds)

      	let rect:Group = Rectangle.fromTopLeft(new Pt(bounds[0],bounds[1]),bounds[2],bounds[3])

      	let patch:Patch = this.addPatch(rect)
      	
      	let label = parseFloat(row[1])
      	patch.setLabel(label);

  		}

      

      

      
    });
  }


  public saveToCsv(){
  	let data = [] 
  	data.push([
  			'region_id',
  			'number',
  			'page_id',
  			'region_url',
  			'page_url',
  			'xywh'
  		])
  	for(let i = 0; i < this.patches$.value.length; i++){
  		let patch = this.patches$.value[i]
  		let xywh = patch.rect[0][0]+","+patch.rect[0][1]+","+patch.getWidth()+","+patch.getHeight();
  		data.push([
  			'region_id',
  			patch.label,
  			'page_id',
  			'region_url',
  			'page_url',
  			xywh
  			])
  		
  	}

  	var csv = this.papa.unparse(data);
  	saveAs(new Blob([csv]), 'numbers.csv')
  }

  setActive(id: number, state: boolean){
  	let items:Patch[] = [...this.patches$.value];

  	let patch = items.find((patch:Patch) => patch.id == id)
  	patch.active = state;

		this.patches$.next(items)
  }


  get patches() {
    return this.patches$.asObservable();
  }




}
