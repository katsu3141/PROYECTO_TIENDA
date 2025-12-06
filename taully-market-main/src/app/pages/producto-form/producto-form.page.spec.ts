import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductoFormPage } from './producto-form.page';

describe('ProductoFormPage', () => {
  let component: ProductoFormPage;
  let fixture: ComponentFixture<ProductoFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductoFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
