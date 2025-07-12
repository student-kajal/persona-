import React, { useState } from 'react';

const Calculator = () => {
  const [input, setInput] = useState('');

  const handleClick = (value) => {
    setInput((prev) => prev + value);
  };

  const calculate = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(input);
      setInput(String(result));
    } catch {
      setInput('Error');
    }
  };

  const clear = () => {
    setInput('');
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '8px',
      maxWidth: '220px',
      backgroundColor: '#f9f9f9'
    }}>
      <input
        type="text"
        value={input}
        readOnly
        style={{
          width: '100%',
          fontSize: '1.2rem',
          marginBottom: '10px',
          padding: '5px',
          textAlign: 'right',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','C','+'].map((btn) =>
          btn === 'C' ? (
            <button key={btn} onClick={clear} style={{ padding: '10px' }}>{btn}</button>
          ) : btn === '+' ? (
            <button key={btn} onClick={() => handleClick(btn)} style={{ padding: '10px' }}>{btn}</button>
          ) : (
            <button key={btn} onClick={() => handleClick(btn)} style={{ padding: '10px' }}>{btn}</button>
          )
        )}
        <button
          onClick={calculate}
          style={{
            gridColumn: 'span 4',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          =
        </button>
      </div>
    </div>
  );
};

export default Calculator;
