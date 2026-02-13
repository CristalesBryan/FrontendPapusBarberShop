import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompraAquiComponent } from './compra-aqui.component';

describe('CompraAquiComponent', () => {
  let component: CompraAquiComponent;
  let fixture: ComponentFixture<CompraAquiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompraAquiComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompraAquiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
