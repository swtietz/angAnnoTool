import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

import { fromEvent } from 'rxjs'

import { Patch, PatchManagerService} from '../patch-manager.service'


@Component({
  selector: 'app-patch-detail',
  templateUrl: './patch-detail.component.html',
  styleUrls: ['./patch-detail.component.css']
})
export class PatchDetailComponent implements OnInit {

	@ViewChild('patchCanvas') public canvas: ElementRef;
  @ViewChild('patchContainer') public patchContainer: ElementRef;

	@Input() patch: Patch;



  constructor(public patchManager: PatchManagerService) { 

  }


  ngOnInit() {

  }

  ngAfterViewInit(){
  	let canvEl = this.canvas.nativeElement
  	canvEl.width = this.patch.getWidth();
		canvEl.height = this.patch.getHeight();
		canvEl.getContext("2d").putImageData(this.patch.getImageData(), 0,0)

    fromEvent(this.patchContainer.nativeElement,'mouseenter').subscribe(() => this.patchManager.setActive(this.patch.id, true))
    fromEvent(this.patchContainer.nativeElement,'mouseleave').subscribe(() => this.patchManager.setActive(this.patch.id, false))

  }


  delete(){
    this.patchManager.deletePatch(this.patch.id)
  }

  labelChanged(value:string){
    console.log(value);
    this.patchManager.setPatchLabel(this.patch.id, parseFloat(value))
  }


}
