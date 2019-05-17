import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas/canvas.component';

import { PapaParseModule } from 'ngx-papaparse';

import { PatchDetailComponent } from './patch-detail/patch-detail.component'

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    PatchDetailComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PapaParseModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
