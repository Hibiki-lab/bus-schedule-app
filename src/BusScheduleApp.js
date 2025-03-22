import React, { useState, useEffect } from 'react';

// JSONファイルのフォーマット例:
// {
//   "bus_stop": "バス停名",
//   "timetable": ["08:00", "08:30", "09:00"]
// }

function BusScheduleApp() {
  const [timetables, setTimetables] = useState({});
  const [selectedBusStop, setSelectedBusStop] = useState('');
  const [newBusStopName, setNewBusStopName] = useState('');
  const [nextBus, setNextBus] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      updateNextBus(now);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedBusStop, timetables]);

  const handleTimetableChange = (index, value) => {
    const newTimetable = [...(timetables[selectedBusStop] || [])];
    newTimetable[index] = value;
    setTimetables({ ...timetables, [selectedBusStop]: newTimetable });
  };

  const addTimeRow = () => {
    setTimetables({
      ...timetables,
      [selectedBusStop]: [...(timetables[selectedBusStop] || []), ''],
    });
  };

  const removeTimeRow = (index) => {
    setTimetables({
      ...timetables,
      [selectedBusStop]: timetables[selectedBusStop].filter((_, i) => i !== index),
    });
  };

  const updateNextBus = (now) => {
    if (!selectedBusStop || !timetables[selectedBusStop]) {
      setNextBus(null);
      return;
    }

    const filteredTimetable = timetables[selectedBusStop].filter((t) => /^\d{2}:\d{2}$/.test(t));
    if (filteredTimetable.length === 0) {
      setNextBus(null);
      return;
    }

    const nowTime = now.getHours() * 60 + now.getMinutes();
    const sortedTimes = filteredTimetable
      .map((timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { timeStr, totalMinutes: hours * 60 + minutes };
      })
      .sort((a, b) => a.totalMinutes - b.totalMinutes);

    const next = sortedTimes.find((busTime) => busTime.totalMinutes > nowTime);

    setNextBus(next || null);
  };

  const calculateTimeRemaining = (busTimeStr) => {
    const now = new Date();
    const [busHour, busMin] = busTimeStr.split(':').map(Number);
    const busTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), busHour, busMin);
    const diffMs = busTime - now;

    if (diffMs < 0) return '終了';

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);

    return `${diffMinutes}分${diffSeconds}秒`;
  };

  const handleFileUpload = (event) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      setTimetables({ ...timetables, [data.bus_stop]: data.timetable });
      setSelectedBusStop(data.bus_stop);
    };
    fileReader.readAsText(event.target.files[0]);
  };

  const addNewBusStop = () => {
    if (newBusStopName && !timetables[newBusStopName]) {
      setTimetables({ ...timetables, [newBusStopName]: [] });
      setSelectedBusStop(newBusStopName);
      setNewBusStopName('');
    }
  };

  const removeBusStop = (busStop) => {
    const {[busStop]: _, ...remainingStops} = timetables;
    setTimetables(remainingStops);
    if (selectedBusStop === busStop) setSelectedBusStop('');
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">バス停時刻表アプリ</h1>

      <input type="file" accept=".json" onChange={handleFileUpload} className="mb-4" />

      <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="新しいバス停名"
          value={newBusStopName}
          onChange={(e) => setNewBusStopName(e.target.value)}
          className="p-2 border rounded w-full mr-2"
        />
        <button onClick={addNewBusStop} className="p-2 bg-purple-500 text-white rounded">
          バス停を追加
        </button>
      </div>

      <div className="mb-4">
        {Object.keys(timetables).map((busStop) => (
          <div key={busStop} className="inline-flex items-center mr-2 mb-2">
            <button
              onClick={() => setSelectedBusStop(busStop)}
              className={`p-2 rounded ${selectedBusStop === busStop ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {busStop}
            </button>
            <button
              onClick={() => removeBusStop(busStop)}
              className="ml-1 p-1 bg-red-500 text-white rounded text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4">現在時刻: {currentTime}</div>

      {selectedBusStop && (
        <>
          {nextBus ? (
            <div className="mb-4 text-lg">
              次のバス: {nextBus.timeStr}（あと{calculateTimeRemaining(nextBus.timeStr)}）
            </div>
          ) : (
            <div className="mb-4 text-lg">本日のバスは終了しました。</div>
          )}

          <table className="w-full mb-4">
            <thead>
              <tr>
                <th className="text-left">時刻表 (HH:MM)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(timetables[selectedBusStop] || []).map((time, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => handleTimetableChange(index, e.target.value)}
                      className="p-2 border rounded w-full"
                      placeholder="例: 08:30"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => removeTimeRow(index)}
                      className="ml-2 p-2 bg-red-500 text-white rounded"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addTimeRow} className="p-2 bg-green-500 text-white rounded">
            時刻を追加
          </button>
        </>
      )}
    </div>
  );
}

export default BusScheduleApp;

