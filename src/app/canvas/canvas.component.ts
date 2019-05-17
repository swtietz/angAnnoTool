import { Component, OnInit, Input, ElementRef, AfterViewInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { fromEvent, from, Observable } from 'rxjs';
import { switchMap, takeUntil, pairwise, delay, map, flatMap } from 'rxjs/operators';

import {CanvasSpace, CanvasForm, Pt, Group, Line, Rectangle} from "pts"

import {MatButtonModule} from '@angular/material/button';

import { Patch, PatchManagerService } from '../patch-manager.service';

import { Papa, PapaParseResult } from 'ngx-papaparse';


import {readFileAsDataURL, readFileAsBase64} from '@webacad/observable-file-reader';


@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit {

	@ViewChild('canvas') public canvas: ElementRef;
	@ViewChildren('patchCanvas') patches: QueryList<ElementRef>
  @ViewChild('csvFile') public csvFileField: ElementRef;



	private space: CanvasSpace;
	private form: CanvasForm;


	
	private cx: CanvasRenderingContext2D;

	public imagePath: string = "assets/test.jpg";
	public imageWidth: number;
	public imageHeight: number;

	public horLines: Group[] = [];
	public verLines: Group[] = [];

	//public rectangles: Group[] = [];



	private currentTool = this.horizontalTool;

  constructor(public patchManager: PatchManagerService, private papa: Papa) { 

    
    
    
  }

  ngOnInit() {

    
  }

  public ngAfterViewInit() {
  	const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
  	
  	this.space = new CanvasSpace("#canvas");
  	this.space.setup({offscreen:false})
  	this.form = this.space.getForm();
    this.space.add( () => {
    	this.form.point( this.space.pointer, 100 ) 

    });
  	
  	/*
    this.cx = canvasEl.getContext('2d');

    // set some default properties about the line
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';
    
    */
    const image = new Image(); // Using optional size for image

		
    fromEvent(image, 'load').subscribe(() => {
			this.imageWidth = image.naturalWidth;
			this.imageHeight = image.naturalHeight;
			canvasEl.width = image.naturalWidth;
      canvasEl.height = image.naturalHeight;

      
    	from(createImageBitmap(image)).subscribe((bitmap: ImageBitmap) => {
    			let currentImage = document.createElement('canvas'); 
    			currentImage.width = image.naturalWidth
    			currentImage.height = image.naturalHeight
    			currentImage.getContext('2d').drawImage(bitmap, 0, 0)
    			this.patchManager.setImage(currentImage)

	    		this.space.add(() => {
	    			this.form.image(bitmap, new Pt(0,0))
						this.form.strokeOnly("#f00 ", 2).lines(this.horLines)
						this.form.strokeOnly("#f00 ", 2).lines(this.verLines)
						this.form.fill("#f004 ").rects(this.patchManager.getRectangles())
					}
				)

    	})
    })




		image.src = this.imagePath;

		this.space.play()

		fromEvent(image, 'load').pipe(delay(500)).subscribe(() => {this.space.pause(), console.log('pause')})

		//this.space.pause();

		fromEvent(canvasEl, 'mouseenter').subscribe(() => {this.space.resume(), console.log('play')})

		fromEvent(canvasEl, 'mouseleave').subscribe(() => {this.space.pause(), console.log('pause')})
		/*
    // we'll implement this method to start capturing mouse events
    //this.captureEvents(canvasEl);

    */
    let parse = (csvData):Observable<PapaParseResult> => {
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
    

    fromEvent(this.csvFileField.nativeElement, 'change').pipe(
      map((fileSelectedEvent:Event) => {
        return (<HTMLInputElement>fileSelectedEvent.target).files[0];
      }),
      switchMap((file:File):Observable<string> => readFileAsBase64(file)),
      map((text:string) => atob(text)),
      switchMap(parse)
      ).subscribe((data: PapaParseResult) => {
      console.log('done');
      console.log(data);
    });

    /*
    fromEvent(this.csvFileField.nativeElement, 'change').pipe(
      map((fileSelectedEvent:Event) => {
        return (<HTMLInputElement>fileSelectedEvent.target).files[0];
      }),
      switchMap((filePath:File)=> {
        let fileReader = new FileReader();
        const fileReader$ = fromEvent(fileReader, 'load')
        fileReader.readAsText(filePath)

        return fileReader$
      }),
      map((fileReadEvent:Event) => {
        return fileReadEvent
      })
      ).subscribe((result:string)=>console.log)

  */

    fromEvent(canvasEl, 'mousemove').subscribe(() => {
    	if(! this.space.isPlaying){
    		this.space.play()
    	}
    })

    fromEvent(canvasEl, 'click').subscribe((event : MouseEvent) => {
    	console.log(event)
  		
    	this.currentTool(event)
  	
    })

  }

  private verticalTool(event){
  	var p1:Pt = new Pt(event.layerX, event.layerY);
  	p1[1] = 0
  	var p2:Pt = new Pt(event.layerX, event.layerY);
  	p2[1] = this.imageHeight; 

  	var line = new Group(p1,p2)

  	console.log(line)
  		
  	this.verLines.push(line)
  }

  private horizontalTool(event){
  	var p1:Pt = new Pt(event.layerX, event.layerY);
  	p1[0] = 0
  	var p2:Pt = new Pt(event.layerX, event.layerY);
  	p2[0] = this.imageWidth; 

  	var line = new Group(p1,p2)

  	console.log(line)
  		
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

  public fileChanged(event:Event){
    console.log(event);
    let file = (<HTMLInputElement>event.target).files[0];
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      console.log(fileReader.result);
    }
    fileReader.readAsText(file);
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
