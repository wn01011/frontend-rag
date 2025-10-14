# Modal 컴포넌트 가이드라인

## Modal 기본 구조

모달은 사용자의 주의를 집중시키고 중요한 정보나 작업을 처리하는 오버레이 컴포넌트입니다.

### 기본 Modal 컴포넌트
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnOverlayClick = true
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button onClick={onClose}>×</button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### Modal 스타일링
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 90%;
  max-height: 90vh;
  overflow: auto;
}
```

### 사용 예시
```tsx
const [isModalOpen, setIsModalOpen] = useState(false);

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="확인"
>
  <p>정말 삭제하시겠습니까?</p>
  <button onClick={handleDelete}>삭제</button>
  <button onClick={() => setIsModalOpen(false)}>취소</button>
</Modal>
```