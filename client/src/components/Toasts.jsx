import React from 'react';

export default function Toasts({ items }) {
  return (
    <div id="toasts">
      {items.map(t => <div className={'toast ' + (t.type || 'info')} key={t.id}>{t.msg}</div>)}
    </div>
  );
}
