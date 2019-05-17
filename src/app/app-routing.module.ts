import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CanvasComponent } from './canvas/canvas.component';


const routes: Routes = [
	{ path: '', component: CanvasComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
