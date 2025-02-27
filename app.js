import React, { useState } from 'react';

const PitchListParser = () => {
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [campaignName, setCampaignName] = useState('');
  const [clientName, setClientName] = useState('');
  const [pitchId, setPitchId] = useState('');

  const parseInput = () => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    const result = [];
    
    // Generate a simple pitch ID if not provided
    if (!pitchId) {
      const date = new Date();
      const formattedDate = `${date.getMonth()+1}${date.getDate()}${date.getFullYear().toString().slice(2)}`;
      setPitchId(`PITCH-${formattedDate}-${Math.floor(Math.random()*1000).toString().padStart(3, '0')}`);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip category headers and dividers
      if (line.endsWith(':') || line === '/////') {
        continue;
      }
      
      // Check if this is a TikTok URL
      if (line.includes('tiktok.com/@')) {
        const handle = line.split('@')[1].split('?')[0].trim();
        
        // The next line should be the price and possibly notes
        if (i + 1 < lines.length) {
          const priceLine = lines[i + 1].trim();
          let price = '';
          let notes = '';
          
          // Extract price
          if (priceLine.includes('$')) {
            price = priceLine.split('$')[1].split(' ')[0].trim();
            
            // Extract notes if any
            if (priceLine.includes('-')) {
              notes = priceLine.split('-')[1].trim();
            } else if (priceLine.includes(',')) {
              notes = priceLine.split(',').slice(1).join(',').trim();
            } else if (priceLine.split(' ').length > 1) {
              const priceText = priceLine.split('$')[0] + '$' + price;
              notes = priceLine.replace(priceText, '').trim();
            }
          }
          
          // Extract the creator handle for easy reference
          const creatorHandle = '@' + handle;
          
          result.push({
            handle: creatorHandle,
            url: line,
            price: price ? parseFloat(price) : 0,
            notes: notes
          });
          
          // Skip the price line since we've processed it
          i++;
        }
      }
    }
    
    setParsedData(result);
  };

  const exportToCSV = () => {
    // Create CSV header - Airtable-friendly format
    const csvContent = [
      ['Creator Handle', 'Creator URL', 'Client Price', 'Special Notes', 'Campaign', 'Client', 'Pitch ID']
    ];
    
    // Add data rows
    parsedData.forEach(item => {
      csvContent.push([
        item.handle,
        item.url,
        item.price,
        item.notes,
        campaignName,
        clientName,
        pitchId
      ]);
    });
    
    // Convert to CSV string
    const csv = csvContent.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    ).join('\n');
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `pitch-list-${pitchId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyToClipboard = () => {
    // Format data as tab-separated values for direct paste into Airtable
    const tsvContent = [
      ['Creator Handle', 'Creator URL', 'Client Price', 'Special Notes', 'Campaign', 'Client', 'Pitch ID']
    ];
    
    parsedData.forEach(item => {
      tsvContent.push([
        item.handle,
        item.url,
        item.price,
        item.notes,
        campaignName,
        clientName,
        pitchId
      ]);
    });
    
    // Convert to TSV string (better for clipboard)
    const tsv = tsvContent.map(row => row.join('\t')).join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(tsv)
      .then(() => {
        alert('Data copied to clipboard! You can now paste directly into Airtable.');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard. Please use the CSV export instead.');
      });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Salmon Studios Pitch List Parser</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Song/Artist or Brand Campaign"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Pitch ID (optional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={pitchId}
            onChange={(e) => setPitchId(e.target.value)}
            placeholder="PITCH-MMDDYY-XXX"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Paste Pitch List</label>
        <textarea
          className="w-full p-2 border rounded h-64"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your pitch list here... (TikTok URLs and prices)"
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={parseInput}
        >
          Parse Pitch List
        </button>
        
        {parsedData.length > 0 && (
          <>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              onClick={exportToCSV}
            >
              Export to CSV
            </button>
            <button
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
              onClick={copyToClipboard}
            >
              Copy for Airtable Paste
            </button>
          </>
        )}
      </div>
      
      {parsedData.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Parsed Data</h2>
          <p className="mb-4 text-sm">Found {parsedData.length} creators ready for Airtable</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Handle</th>
                  <th className="py-2 px-4 border">Client Price</th>
                  <th className="py-2 px-4 border">Special Notes</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border">{item.handle}</td>
                    <td className="py-2 px-4 border">${item.price}</td>
                    <td className="py-2 px-4 border">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-sm font-medium">Airtable Import Instructions:</p>
            <ol className="text-sm ml-5 list-decimal">
              <li>Click "Copy for Airtable Paste" above</li>
              <li>Go to your Airtable Pitch Items table</li>
              <li>Select the first cell where you want to paste</li>
              <li>Press Ctrl+V (or Cmd+V on Mac) to paste</li>
              <li>Airtable will recognize the column headers and match them</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchListParser;
