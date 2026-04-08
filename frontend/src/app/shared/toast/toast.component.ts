import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-container" *ngIf="message">
      <div class="toast" [ngClass]="message.type">
        <span>{{ message.message }}</span>
        <button class="close-btn" (click)="close()">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    }
    .toast {
      min-width: 250px;
      padding: 16px 20px;
      border-radius: 8px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out forwards;
      font-weight: 500;
    }
    .toast.success { background-color: var(--success-color, #10B981); }
    .toast.error { background-color: var(--danger-color, #EF4444); }
    .toast.info { background-color: var(--accent-color, #2E7CF6); }
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      margin-left: 15px;
      opacity: 0.8;
    }
    .close-btn:hover { opacity: 1; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  message: ToastMessage | null = null;
  private sub!: Subscription;
  private timeoutId: any;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toastState.subscribe(msg => {
      this.message = msg;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => this.close(), 3000);
    });
  }

  close() {
    this.message = null;
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
}
