import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { RefreshCw, Dices, Layers, Hash, TrendingUp, BarChart2, Target } from 'lucide-react';

function calculateTheoreticalProbabilities(numDice: number, numSides: number) {
  let prev: Record<number, number> = { 0: 1 };
  for (let d = 1; d <= numDice; d++) {
    const current: Record<number, number> = {};
    for (const [sumStr, prob] of Object.entries(prev)) {
      const sum = parseInt(sumStr);
      for (let s = 1; s <= numSides; s++) {
        current[sum + s] = (current[sum + s] || 0) + prob * (1 / numSides);
      }
    }
    prev = current;
  }
  return prev;
}

function simulateRolls(numDice: number, numSides: number, numRolls: number) {
  const frequencies: Record<number, number> = {};
  for (let i = 0; i < numRolls; i++) {
    let sum = 0;
    for (let d = 0; d < numDice; d++) {
      sum += Math.floor(Math.random() * numSides) + 1;
    }
    frequencies[sum] = (frequencies[sum] || 0) + 1;
  }
  return frequencies;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-800 mb-2">Sum: {label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-indigo-600">
            <span className="font-medium mr-1">Simulated:</span>
            {payload[0].value.toFixed(3)}%
          </p>
          <p className="text-slate-600">
            <span className="font-medium mr-1">Theoretical:</span>
            {payload[1].value.toFixed(3)}%
          </p>
          <p className="text-slate-400 mt-2 text-xs pt-2 border-t border-slate-100">
            Count: {payload[0].payload.frequency.toLocaleString()} rolls
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [numDice, setNumDice] = useState(2);
  const [numSides, setNumSides] = useState(6);
  const [numRolls, setNumRolls] = useState(1000);
  
  const [simulatedFreqs, setSimulatedFreqs] = useState<Record<number, number>>({});
  const [isSimulating, setIsSimulating] = useState(false);

  const theoretical = useMemo(() => {
    return calculateTheoreticalProbabilities(numDice, numSides);
  }, [numDice, numSides]);

  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    // Use timeout to allow UI update before heavy computation starts
    setTimeout(() => {
      const freqs = simulateRolls(numDice, numSides, numRolls);
      setSimulatedFreqs(freqs);
      setIsSimulating(false);
    }, 10);
  }, [numDice, numSides, numRolls]);

  // Run initial simulation and re-run when parameters change
  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const chartData = useMemo(() => {
    const data = [];
    for (let sum = numDice; sum <= numDice * numSides; sum++) {
      const theoProb = theoretical[sum] || 0;
      const simFreq = simulatedFreqs[sum] || 0;
      const simProb = simFreq / Math.max(numRolls, 1);
      data.push({
        sum,
        theoretical: theoProb * 100, // as percentage
        simulated: simProb * 100, // as percentage
        frequency: simFreq
      });
    }
    return data;
  }, [numDice, numSides, numRolls, theoretical, simulatedFreqs]);

  const expectedMean = (numDice * (numSides + 1)) / 2;
  const simulatedMean = useMemo(() => {
    let totalSum = 0;
    for (const [sum, freq] of Object.entries(simulatedFreqs)) {
      totalSum += Number(sum) * freq;
    }
    return numRolls > 0 ? totalSum / numRolls : 0;
  }, [simulatedFreqs, numRolls]);

  const mostCommonSimulated = useMemo(() => {
    let maxFreq = 0;
    let modes: string[] = [];
    for (const [sumStr, freq] of Object.entries(simulatedFreqs)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        modes = [sumStr];
      } else if (freq === maxFreq) {
        modes.push(sumStr);
      }
    }
    if (modes.length > 5) return "Multiple";
    return modes.join(', ') || '-';
  }, [simulatedFreqs]);

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden select-none">
      {/* Header Section */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Probability Engine <span className="text-slate-400 font-normal">| Dice Simulator</span></h1>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">Sample Size: {numRolls.toLocaleString()}</div>
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            Reset Simulation
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Number of Dice</span>
              <input 
                type="range" 
                className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
                min="1" max="20" 
                value={numDice}
                onChange={e => setNumDice(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-sm mt-1 text-slate-600">
                <span>1</span>
                <span className="font-bold text-indigo-600">{numDice} Dice</span>
                <span>20</span>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Sides per Die</span>
              <div className="grid grid-cols-3 gap-2">
                {[4, 6, 8, 10, 12, 20].map((sides) => (
                  <button
                    key={sides}
                    onClick={() => setNumSides(sides)}
                    className={`px-2 py-2 rounded text-sm transition-colors ${
                      numSides === sides
                        ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    {sides}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Simulation Rolls</span>
              <input 
                type="number" 
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={numRolls}
                onChange={e => setNumRolls(parseInt(e.target.value) || 100)}
                min="100"
                max="100000"
              />
              <p className="text-[10px] text-slate-400 mt-1">Higher numbers increase accuracy but take longer to process.</p>
            </label>
          </div>

          <div className="mt-auto">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Outcome Stats</span>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Observed Mean</span>
                  <span className="text-xs font-bold">{simulatedMean.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Theoretical Mean</span>
                  <span className="text-xs font-bold">{expectedMean.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Most Common</span>
                  <span className="text-xs font-bold truncate max-w-[80px] text-right" title={mostCommonSimulated}>{mostCommonSimulated}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Simulation Display */}
        <main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
          {/* Chart Section */}
          <div className="flex-1 min-h-[300px] bg-white border border-slate-200 rounded-xl p-8 flex flex-col relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">Distribution of Sums</h3>
                <p className="text-sm text-slate-500">Comparison of experimental results vs. normal distribution curve</p>
              </div>
              <div className="flex gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-indigo-200 rounded-sm"></span> Experimental
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-indigo-600 rounded-full"></span> Theoretical
                </div>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <XAxis 
                    dataKey="sum" 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickMargin={12}
                    label={{ value: 'Sum of Dice', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis 
                    tickFormatter={(val) => `${val}%`}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickMargin={12}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar 
                    name="Simulated Frequency" 
                    dataKey="simulated" 
                    fill="#c7d2fe"
                    radius={[2, 2, 0, 0]} 
                    maxBarSize={60}
                    animationDuration={500}
                  />
                  <Line 
                    name="Theoretical Probability"
                    type="monotone" 
                    dataKey="theoretical" 
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={500}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Data Grid */}
          <div className="h-48 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shrink-0">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="w-16">Sum</span>
              <span className="flex-1">Frequency (n)</span>
              <span className="flex-1">Simulated %</span>
              <span className="flex-1">Theoretical %</span>
              <span className="w-24 text-right">Variance</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chartData.map((data, idx) => {
                const variance = data.simulated - data.theoretical;
                const isPositive = variance > 0;
                return (
                  <div key={data.sum} className={`flex items-center px-4 py-2 text-sm border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <span className="w-16 font-bold">{data.sum}</span>
                    <span className="flex-1">{data.frequency.toLocaleString()}</span>
                    <span className="flex-1">{data.simulated.toFixed(2)}%</span>
                    <span className="flex-1 text-slate-400">{data.theoretical.toFixed(2)}%</span>
                    <span className={`w-24 text-right ${Math.abs(variance) > 0.005 ? (isPositive ? 'text-emerald-600' : 'text-rose-500') : 'text-slate-400'}`}>
                      {isPositive && Math.abs(variance) > 0.005 ? '+' : ''}{variance.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
