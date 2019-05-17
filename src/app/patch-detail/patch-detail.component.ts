import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

import { fromEvent } from 'rxjs'

import { Patch } from '../patch-manager.service'

@Component({
  selector: 'app-patch-detail',
  templateUrl: './patch-detail.component.html',
  styleUrls: ['./patch-detail.component.css']
})
export class PatchDetailComponent implements OnInit {

	@ViewChild('patchCanvas') public canvas: ElementRef;
  @ViewChild('patchContainer') public patchContainer: ElementRef;

	@Input() patch: Patch;



  constructor() { 

  }


  ngOnInit() {

  }

  ngAfterViewInit(){
  	let canvEl = this.canvas.nativeElement
  	canvEl.width = this.patch.getWidth();
		canvEl.height = this.patch.getHeight();
		canvEl.getContext("2d").putImageData(this.patch.getImageData(), 0,0)

    fromEvent(this.patchContainer.nativeElement,'mousemove').subscribe(() => console.log(this.patch.label))
    fromEvent(this.patchContainer.nativeElement,'mousemove').subscribe(() => this.patch.setActive(true))
    fromEvent(this.patchContainer.nativeElement,'mouseleave').subscribe(() => this.patch.setActive(false))

  }


}
