import { useRef, ChangeEvent } from 'react';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';

const MAX_DIMENSION = 1024;
const MAX_SIZE_MB = 4;

function resizeDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(dataUrl);
        return;
      }
      if (width >= height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas ctx unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png', 0.92));
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = dataUrl;
  });
}

export default function PhotoUpload() {
  const { state, set } = useFormState();
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`> ${MAX_SIZE_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      try {
        const resized = await resizeDataUrl(raw);
        set('profileImage', resized);
      } catch {
        set('profileImage', raw);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const remove = () => set('profileImage', null);

  return (
    <div className="form-section">
      <label className="form-label">{t.profileImage}</label>
      <div className="photo-upload">
        <button
          type="button"
          className="photo-thumb"
          onClick={() => inputRef.current?.click()}
          aria-label={state.profileImage ? t.profileImage : t.uploadHint}
        >
          {state.profileImage ? (
            <img src={state.profileImage} alt="" />
          ) : (
            <div className="photo-placeholder">
              <span className="photo-icon" aria-hidden>📷</span>
              <span className="photo-hint">{t.uploadHint}</span>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          style={{ display: 'none' }}
        />
        {state.profileImage && (
          <button type="button" className="btn ghost photo-remove" onClick={remove}>
            ✕ {t.uploadRemove}
          </button>
        )}
      </div>
    </div>
  );
}
