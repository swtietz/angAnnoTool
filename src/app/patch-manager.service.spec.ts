import { TestBed } from '@angular/core/testing';

import { PatchManagerService } from './patch-manager.service';

describe('PatchManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PatchManagerService = TestBed.get(PatchManagerService);
    expect(service).toBeTruthy();
  });
});
