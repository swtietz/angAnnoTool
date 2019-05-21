import { Component, OnInit, Input, ElementRef, AfterViewInit, ViewChild, ViewChildren, QueryList, ChangeDetectionStrategy } from '@angular/core';
import { fromEvent, from, Observable } from 'rxjs';
import { switchMap, takeUntil, pairwise, delay, map, flatMap } from 'rxjs/operators';

import {CanvasSpace, CanvasForm, Pt, Group, Line, Rectangle} from "pts"

import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list'

import { Patch, PatchManagerService } from '../patch-manager.service';

import {ScrollingModule} from '@angular/cdk/scrolling';


@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit {

	@ViewChild('canvas') public canvas: ElementRef;
	@ViewChildren('patchCanvas') patches: QueryList<ElementRef>
  @ViewChild('csvFile') public csvFileField: ElementRef;
  @ViewChild('imgCanvasContainer') public imgCanvasContainer: ElementRef;


	private space: CanvasSpace;
	private form: CanvasForm;


	
	private cx: CanvasRenderingContext2D;


  public image: HTMLImageElement = new Image();
	public imageWidth: number;
	public imageHeight: number;
  public scale: number;

  public curX: number = 0;
  public curY: number = 0;

	public horLines: Group[] = [];
	public verLines: Group[] = [];

	//public rectangles: Group[] = [];



	private currentTool = this.horizontalTool;

  constructor(public patchManager: PatchManagerService) { 

    
    
    
  }

  ngOnInit() {

    
  }

  public ngAfterViewInit() {
  	const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;

  	let ctx = canvasEl.getContext('2d');
    ctx.scale(0.1, 0.1)

  	this.space = new CanvasSpace(canvasEl);
  	this.space.setup({offscreen:false})
  	this.form = this.space.getForm();

  	
  	/*

    // set some default properties about the line
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';
    
    */
    //const image = new Image(); // Using optional size for image

		
    fromEvent(this.image, 'load').subscribe(() => {
			this.imageWidth = this.image.naturalWidth;
			this.imageHeight = this.image.naturalHeight;

      let viewportWidth = this.imgCanvasContainer.nativeElement.offsetWidth;

      let imageWidth = this.image.naturalWidth;

      this.scale = viewportWidth/imageWidth;

			canvasEl.width = this.image.naturalWidth;
      canvasEl.height = this.image.naturalHeight;
      canvasEl.style.width = this.image.naturalWidth*this.scale +"px";
      canvasEl.style.height = ""+this.image.naturalHeight*this.scale +"px";



      
    	from(createImageBitmap(this.image)).subscribe((bitmap: ImageBitmap) => {
          
    			let currentImage = document.createElement('canvas'); 
    			currentImage.width = this.image.naturalWidth
    			currentImage.height = this.image.naturalHeight
    			currentImage.getContext('2d').drawImage(bitmap, 0, 0)
    			this.patchManager.setImage(currentImage)


	    		this.space.add((time, ftime, space:CanvasSpace) => {

            

	    			this.form.image(bitmap, new Pt(0,0))
						this.form.strokeOnly("#f008 ", 10).lines(this.horLines)
						this.form.strokeOnly("#f008 ", 10).lines(this.verLines)
            let patches:Patch[] = this.patchManager.patches$.value;
            for(let i = 0; i < patches.length; i++){
              let p = patches[i];
              if(p.active){

                this.form.fill("#00f4 ").stroke('#00f').rect(p.rect)
              }else{
                this.form.fill("#f004 ").stroke('#f00 ').rect(p.rect)
              }
              
            }

            if(this.currentTool == this.horizontalTool){
              this.form.strokeOnly("#f005 ", 10).line([new Pt(0, this.curY), new Pt(this.imageWidth / this.scale, this.curY)])
            }else{
              this.form.strokeOnly("#f005 ", 10).line([new Pt(this.curX, 0), new Pt(this.curX, this.imageHeight / this.scale)])
            }
            
						
					}
				)

    	})
    })




		this.space.play()



		fromEvent(canvasEl, 'mouseenter').subscribe(() => {this.space.resume(), console.log('play')})


    

    fromEvent(this.csvFileField.nativeElement, 'change').pipe(
      map((fileSelectedEvent:Event) => (<HTMLInputElement>fileSelectedEvent.target).files[0]))
    .subscribe((file:File) => this.patchManager.initRectsFromCSV(file))
      


    fromEvent(canvasEl, 'mousemove').subscribe((event:MouseEvent) => {
    	if(! this.space.isPlaying){
    		this.space.play()

    	}
      this.curX = event.layerX / this.scale;
      this.curY = event.layerY / this.scale;


    })

    fromEvent(canvasEl, 'click').subscribe((event : MouseEvent) => {
      console.log(event);
    	this.currentTool(event)
    })

  }

  private verticalTool(event){
    let x = event.layerX / this.scale;
    let y = event.layerY / this.scale;

  	var p1:Pt = new Pt(x, y);
  	p1[1] = 0
  	var p2:Pt = new Pt(x, y);
  	p2[1] = this.imageHeight / this.scale; 


  	var line = new Group(p1,p2)

    console.log(x,y)

  	this.verLines.push(line)
  }

  private horizontalTool(event){
    let x = event.layerX / this.scale;
    let y = event.layerY / this.scale;

  	var p1:Pt = new Pt(x, y);
  	p1[0] = 0
  	var p2:Pt = new Pt(x, y);
  	p2[0] = this.imageWidth / this.scale; 

  	var line = new Group(p1,p2)

  	this.horLines.push(line)
  }


  public setHorizontalTool(){
  	this.currentTool = this.horizontalTool;
  }

  public setVerticalTool(){
  	this.currentTool = this.verticalTool;
  }


  public createRects(){
  	this.horLines.sort(function(a, b){return a[0][1] - b[0][1]});
  	this.verLines.sort(function(a, b){return a[0][0] - b[0][0]});

  	for(var i = 0; i < this.horLines.length - 1; i++){
  		let upper = this.horLines[i][0][1]; // y coord of upper bound of rect
  		let lower = this.horLines[i+1][0][1]; // y coord of lower bound of rect
  		for(var j = 0; j < this.verLines.length - 1; j++){
  			let left = this.verLines[j][0][0]
  			let right = this.verLines[j+1][0][0]

  			this.patchManager.addPatch(Rectangle.fromTopLeft([left, upper], right-left, lower-upper))
  		}
  	}

  	this.horLines = []
  	this.verLines = []

  	from([1]).pipe(
    	map(() => this.space.resume()),
    	delay(10)).subscribe(
    	() => this.space.pause()
    )

  	window['horLines'] = this.horLines; 
  	window['verLines'] = this.verLines;

  	window['canvs'] = this.patches;

	  

	}

  /**
   * Called when the csv input file has changed
   */
  public fileChanged(event:Event){
    console.log(event);
    let file = (<HTMLInputElement>event.target).files[0];
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      console.log(fileReader.result);
    }
    fileReader.readAsText(file);
  }

  /**
   * Called when the image file has changed
   */
  readURL(event: Event): void {
    console.log(event);
    let file = (<HTMLInputElement>event.target).files[0];
    let path = (<HTMLInputElement>event.target).value;
    this.patchManager.setImagePath(path);

    const reader = new FileReader();
    reader.onload = e => this.image.src = <string>reader.result;

    reader.readAsDataURL(file);
  }

	private captureEvents(canvasEl: HTMLCanvasElement) {
	  // this will capture all mousedown events from the canvas element
	  fromEvent(canvasEl, 'mousedown')
	    .pipe(
	      switchMap((e) => {
	        // after a mouse down, we'll record all mouse moves
	        return fromEvent(canvasEl, 'mousemove')
	          .pipe(
	            // we'll stop (and unsubscribe) once the user releases the mouse
	            // this will trigger a 'mouseup' event    
	            takeUntil(fromEvent(canvasEl, 'mouseup')),
	            // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
	            takeUntil(fromEvent(canvasEl, 'mouseleave')),
	            // pairwise lets us get the previous value to draw a line from
	            // the previous point to the current point    
	            pairwise()
	          )
	      })
	    )
	    .subscribe((res: [MouseEvent, MouseEvent]) => {
	      const rect = canvasEl.getBoundingClientRect();

	      // previous and current position with the offset
	      const prevPos = {
	        x: res[0].clientX - rect.left,
	        y: res[0].clientY - rect.top
	      };

	      const currentPos = {
	        x: res[1].clientX - rect.left,
	        y: res[1].clientY - rect.top
	      };

	      // this method we'll implement soon to do the actual drawing
	      //this.drawOnCanvas(prevPos, currentPos);
	    });
	}



}
