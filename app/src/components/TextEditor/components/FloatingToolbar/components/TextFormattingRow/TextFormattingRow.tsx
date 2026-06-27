import { Divider, HeadingBtn, ListBtn, TextFormatBtn } from './components';
import { headingBtns, listBtns, textFormatBtns } from './textFormattingConfig';
import './TextFormattingRow.css';

export const TextFormattingRow = () => {
  return (
    <div
      className='text-formatting-row'
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      {headingBtns.map((btn) => (
        <HeadingBtn
          key={btn.headingType}
          label={btn.label}
          headingType={btn.headingType}
          icon={btn.icon}
        />
      ))}

      <Divider />

      {textFormatBtns.map((btn) => (
        <TextFormatBtn
          key={btn.formatType}
          label={btn.label}
          formatType={btn.formatType}
          icon={btn.icon}
        />
      ))}

      <Divider />

      {listBtns.map((btn) => (
        <ListBtn
          key={btn.listType}
          label={btn.label}
          listType={btn.listType}
          icon={btn.icon}
        />
      ))}
    </div>
  );
};
