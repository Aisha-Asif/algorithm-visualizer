import React, { useState } from 'react';
import { Play, Download, FileText, Zap, AlertCircle } from 'lucide-react';

const DivideConquerUI = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('closest-pair');
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputData, setInputData] = useState(null);
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const closestPairBrute = (points) => {
    let minDist = Infinity;
    let pair = null;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.sqrt(
          Math.pow(points[i][0] - points[j][0], 2) +
          Math.pow(points[i][1] - points[j][1], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          pair = [points[i], points[j]];
        }
      }
    }
    return { distance: minDist, pair };
  };

  const closestPairDC = (points) => {
    const stepLog = [];
    const pointsSorted = [...points].sort((a, b) => a[0] - b[0]);
    
    const recursiveClosest = (pts, depth = 0) => {
      const n = pts.length;
      stepLog.push({
        type: 'divide',
        depth,
        points: pts,
        message: `Processing ${n} points at depth ${depth}`
      });

      if (n <= 3) {
        const result = closestPairBrute(pts);
        stepLog.push({
          type: 'base',
          depth,
          points: pts,
          result,
          message: `Base case: Found pair with distance ${result.distance.toFixed(2)}`
        });
        return result;
      }

      const mid = Math.floor(n / 2);
      const leftPoints = pts.slice(0, mid);
      const rightPoints = pts.slice(mid);

      stepLog.push({
        type: 'split',
        depth,
        left: leftPoints,
        right: rightPoints,
        message: `Split into ${leftPoints.length} left and ${rightPoints.length} right points`
      });

      const leftResult = recursiveClosest(leftPoints, depth + 1);
      const rightResult = recursiveClosest(rightPoints, depth + 1);

      let minDist = Math.min(leftResult.distance, rightResult.distance);
      let minPair = leftResult.distance < rightResult.distance ? leftResult.pair : rightResult.pair;

      const midX = pts[mid][0];
      const strip = pts.filter(p => Math.abs(p[0] - midX) < minDist);

      stepLog.push({
        type: 'strip',
        depth,
        strip,
        midX,
        minDist,
        message: `Checking ${strip.length} points in strip region`
      });

      const stripSorted = [...strip].sort((a, b) => a[1] - b[1]);
      
      for (let i = 0; i < stripSorted.length; i++) {
        for (let j = i + 1; j < stripSorted.length; j++) {
          if (stripSorted[j][1] - stripSorted[i][1] >= minDist) break;
          
          const dist = Math.sqrt(
            Math.pow(stripSorted[i][0] - stripSorted[j][0], 2) +
            Math.pow(stripSorted[i][1] - stripSorted[j][1], 2)
          );
          
          if (dist < minDist) {
            minDist = dist;
            minPair = [stripSorted[i], stripSorted[j]];
            stepLog.push({
              type: 'update',
              depth,
              pair: minPair,
              distance: minDist,
              message: `Found closer pair in strip: distance ${minDist.toFixed(2)}`
            });
          }
        }
      }

      stepLog.push({
        type: 'merge',
        depth,
        result: { distance: minDist, pair: minPair },
        message: `Merged result at depth ${depth}: distance ${minDist.toFixed(2)}`
      });

      return { distance: minDist, pair: minPair };
    };

    const finalResult = recursiveClosest(pointsSorted);
    return { result: finalResult, steps: stepLog };
  };

  const karatsubaMultiply = (x, y, stepLog = [], depth = 0) => {
    // Convert to strings to handle large numbers
    const xStr = x.toString();
    const yStr = y.toString();
    
    stepLog.push({
      type: 'multiply',
      depth,
      x: xStr,
      y: yStr,
      message: `Multiplying ${xStr.substring(0, 15)}${xStr.length > 15 ? '...' : ''} × ${yStr.substring(0, 15)}${yStr.length > 15 ? '...' : ''}`
    });

    // Base case: use regular multiplication for small numbers
    if (x < 10 || y < 10) {
      const result = x * y;
      stepLog.push({
        type: 'base',
        depth,
        result: result.toString(),
        message: `Base case: ${x} × ${y} = ${result}`
      });
      return result;
    }

    const n = Math.max(xStr.length, yStr.length);
    const m = Math.floor(n / 2);

    const splitNumber = (numStr, position) => {
      const str = numStr.padStart(n, '0');
      const highStr = str.substring(0, str.length - position) || '0';
      const lowStr = str.substring(str.length - position) || '0';
      return {
        high: parseInt(highStr) || 0,
        low: parseInt(lowStr) || 0
      };
    };

    const xSplit = splitNumber(xStr, m);
    const ySplit = splitNumber(yStr, m);

    stepLog.push({
      type: 'split',
      depth,
      high1: xSplit.high.toString(),
      low1: xSplit.low.toString(),
      high2: ySplit.high.toString(),
      low2: ySplit.low.toString(),
      message: `Split numbers at position ${m}`
    });

    const z0 = karatsubaMultiply(xSplit.low, ySplit.low, stepLog, depth + 1);
    const z1 = karatsubaMultiply(
      xSplit.low + xSplit.high, 
      ySplit.low + ySplit.high, 
      stepLog, 
      depth + 1
    );
    const z2 = karatsubaMultiply(xSplit.high, ySplit.high, stepLog, depth + 1);

    const result = z2 * Math.pow(10, 2 * m) + (z1 - z2 - z0) * Math.pow(10, m) + z0;

    stepLog.push({
      type: 'combine',
      depth,
      z0: z0.toString(),
      z1: z1.toString(),
      z2: z2.toString(),
      result: result.toString(),
      message: `Combined results: ${z2}×10^${2*m} + (${z1}-${z2}-${z0})×10^${m} + ${z0}`
    });

    return result;
  };

  const generate10Files = () => {
    const files = [];
    
    if (selectedAlgorithm === 'closest-pair') {
      const sizes = [150, 200, 250, 300, 350, 400, 450, 500, 550, 600]; // All sizes > 100
      sizes.forEach((size, index) => {
        const points = [];
        for (let i = 0; i < size; i++) {
          points.push([
            Math.random() * 10000,  // Increased range for larger datasets
            Math.random() * 10000
          ]);
        }
        files.push({
          id: index + 1,
          name: `closest_pair_input_${index + 1}.txt`,
          size: size,
          data: points,
          content: points.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('\n')
        });
      });
    } else {
      const digitCounts = [120, 140, 160, 180, 200, 220, 240, 260, 280, 300]; // All sizes > 100 digits
      digitCounts.forEach((digits, index) => {
        const generateLargeNumber = (numDigits) => {
          let result = '';
          result += Math.floor(Math.random() * 9) + 1; // First digit 1-9
          for (let i = 1; i < numDigits; i++) {
            result += Math.floor(Math.random() * 10);
          }
          // For very large numbers, we'll handle them as strings in the algorithm
          return result;
        };

        const num1Str = generateLargeNumber(digits);
        const num2Str = generateLargeNumber(digits);
        
        files.push({
          id: index + 1,
          name: `integer_mult_input_${index + 1}.txt`,
          size: digits,
          data: { num1: num1Str, num2: num2Str }, // Store as string
          content: `${num1Str}\n${num2Str}`
        });
      });
    }

    setGeneratedFiles(files);
    setSelectedFile(null);
    setInputData(null);
    setResult(null);
    setSteps([]);
  };

  const selectFile = (file) => {
    setSelectedFile(file);
    
    if (selectedAlgorithm === 'closest-pair') {
      setInputData(file.data);
    } else {
      // For integer multiplication, parse the string numbers
      // We'll handle them as strings in the algorithm to avoid precision issues
      setInputData(file.data);
    }
    
    setResult(null);
    setSteps([]);
    setCurrentStep(0);
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    generatedFiles.forEach(file => {
      setTimeout(() => downloadFile(file), 100);
    });
  };

  const karatsubaMultiplyLarge = (x, y, stepLog = [], depth = 0) => {
    const xStr = typeof x === 'string' ? x : x.toString();
    const yStr = typeof y === 'string' ? y : y.toString();
    
    stepLog.push({
      type: 'multiply',
      depth,
      x: xStr,
      y: yStr,
      message: `Multiplying ${xStr.length}-digit × ${yStr.length}-digit numbers`
    });

    if (xStr.length <= 15 && yStr.length <= 15) {
      const numX = parseInt(xStr);
      const numY = parseInt(yStr);
      const result = numX * numY;
      stepLog.push({
        type: 'base',
        depth,
        result: result.toString(),
        message: `Base case: ${numX} × ${numY} = ${result}`
      });
      return result.toString();
    }

    const n = Math.max(xStr.length, yStr.length);
    const m = Math.floor(n / 2);

    const splitNumber = (numStr, position) => {
      const str = numStr.padStart(n, '0');
      const highStr = str.substring(0, str.length - position) || '0';
      const lowStr = str.substring(str.length - position) || '0';
      return {
        high: highStr,
        low: lowStr
      };
    };

    const xSplit = splitNumber(xStr, m);
    const ySplit = splitNumber(yStr, m);

    stepLog.push({
      type: 'split',
      depth,
      high1: xSplit.high,
      low1: xSplit.low,
      high2: ySplit.high,
      low2: ySplit.low,
      message: `Split at position ${m}`
    });

    const z0 = karatsubaMultiplyLarge(xSplit.low, ySplit.low, stepLog, depth + 1);
    const z1 = karatsubaMultiplyLarge(
      addStrings(xSplit.low, xSplit.high), 
      addStrings(ySplit.low, ySplit.high), 
      stepLog, 
      depth + 1
    );
    const z2 = karatsubaMultiplyLarge(xSplit.high, ySplit.high, stepLog, depth + 1);

    const term1 = multiplyByPowerOf10(z2, 2 * m);
    const term2 = multiplyByPowerOf10(subtractStrings(subtractStrings(z1, z2), z0), m);
    const result = addStrings(addStrings(term1, term2), z0);

    stepLog.push({
      type: 'combine',
      depth,
      z0,
      z1,
      z2,
      result,
      message: `Combined results at depth ${depth}`
    });

    return result;
  };

  const addStrings = (a, b) => {
    let result = '';
    let carry = 0;
    let i = a.length - 1;
    let j = b.length - 1;

    while (i >= 0 || j >= 0 || carry > 0) {
      const digitA = i >= 0 ? parseInt(a[i]) : 0;
      const digitB = j >= 0 ? parseInt(b[j]) : 0;
      const sum = digitA + digitB + carry;
      result = (sum % 10) + result;
      carry = Math.floor(sum / 10);
      i--;
      j--;
    }

    return result;
  };

  const subtractStrings = (a, b) => {
    let result = '';
    let borrow = 0;
    let i = a.length - 1;
    let j = b.length - 1;

    while (i >= 0) {
      const digitA = parseInt(a[i]);
      const digitB = j >= 0 ? parseInt(b[j]) : 0;
      let diff = digitA - digitB - borrow;

      if (diff < 0) {
        diff += 10;
        borrow = 1;
      } else {
        borrow = 0;
      }

      result = diff + result;
      i--;
      j--;
    }

    return result.replace(/^0+/, '') || '0';
  };

  const multiplyByPowerOf10 = (num, power) => {
    return num + '0'.repeat(power);
  };

  const runAlgorithm = () => {
    if (!inputData) return;

    setIsRunning(true);
    setCurrentStep(0);

    setTimeout(() => {
      if (selectedAlgorithm === 'closest-pair') {
        const { result, steps } = closestPairDC(inputData);
        setResult(result);
        setSteps(steps);
      } else {
        const stepLog = [];
        let product;
        
        // Use the appropriate Karatsuba version based on input size
        if (typeof inputData.num1 === 'string' || typeof inputData.num2 === 'string') {
          product = karatsubaMultiplyLarge(inputData.num1, inputData.num2, stepLog);
        } else {
          product = karatsubaMultiply(inputData.num1, inputData.num2, stepLog);
        }
        
        setResult({ product });
        setSteps(stepLog);
      }
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">Divide & Conquer Algorithms</h1>
            <p className="text-blue-100">Visualize and analyze algorithmic efficiency</p>
          </div>

          <div className="p-8 border-b bg-gray-50">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Algorithm</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedAlgorithm('closest-pair');
                  setGeneratedFiles([]);
                  setSelectedFile(null);
                  setInputData(null);
                  setResult(null);
                  setSteps([]);
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedAlgorithm === 'closest-pair'
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-2">📍</div>
                <h3 className="font-semibold text-lg mb-1">Closest Pair of Points</h3>
                <p className="text-sm text-gray-600">Find minimum distance between points</p>
                <p className="text-xs text-gray-500 mt-2">Time: O(n log n)</p>
                <p className="text-xs text-red-500 mt-1">Min: 100+ points</p>
              </button>

              <button
                onClick={() => {
                  setSelectedAlgorithm('integer-mult');
                  setGeneratedFiles([]);
                  setSelectedFile(null);
                  setInputData(null);
                  setResult(null);
                  setSteps([]);
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedAlgorithm === 'integer-mult'
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-2">🔢</div>
                <h3 className="font-semibold text-lg mb-1">Karatsuba Multiplication</h3>
                <p className="text-sm text-gray-600">Efficient integer multiplication</p>
                <p className="text-xs text-gray-500 mt-2">Time: O(n^1.585)</p>
                <p className="text-xs text-red-500 mt-1">Min: 100+ digits</p>
              </button>
            </div>
          </div>

          <div className="p-8 border-b">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Generate Input Files</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={generate10Files}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <Zap className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Generate 10 Files</span>
                <span className="text-xs text-gray-500 mt-1">
                  {selectedAlgorithm === 'closest-pair' 
                    ? 'Sizes: 150-600 points' 
                    : 'Sizes: 120-300 digits'}
                </span>
              </button>

              <button
                onClick={downloadAllFiles}
                disabled={generatedFiles.length === 0}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Download All Files</span>
                <span className="text-xs text-gray-500 mt-1">Save all 10 files</span>
              </button>
            </div>

            {generatedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Generated Files ({generatedFiles.length})</h3>
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {generatedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedFile?.id === file.id
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1"
                          onClick={() => selectFile(file)}
                        >
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="font-medium text-sm text-gray-800">{file.name}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {selectedAlgorithm === 'closest-pair' 
                              ? `${file.size} points`
                              : `${file.size} digits each`}
                          </p>
                          {selectedFile?.id === file.id && (
                            <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-600 text-white rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(file);
                          }}
                          className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-all"
                          title="Download this file"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-b bg-gray-50">
            <button
              onClick={runAlgorithm}
              disabled={!inputData || isRunning}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              <Play className="w-6 h-6 inline mr-2" />
              {isRunning ? 'Running...' : 'Run Algorithm'}
            </button>
          </div>

          {result && (
            <div className="p-8 border-b">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Result</h2>
              
              {selectedAlgorithm === 'closest-pair' ? (
                <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                  <p className="font-semibold text-green-900 text-lg mb-3">
                    Closest Distance: {result.distance?.toFixed(6)}
                  </p>
                  {result.pair && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="bg-white px-4 py-2 rounded-lg border border-green-300">
                          <p className="text-xs text-gray-600 mb-1">Point 1</p>
                          <p className="font-mono text-sm text-gray-800">
                            ({result.pair[0][0].toFixed(3)}, {result.pair[0][1].toFixed(3)})
                          </p>
                        </div>
                        <span className="text-green-600 font-bold">↔</span>
                        <div className="bg-white px-4 py-2 rounded-lg border border-green-300">
                          <p className="text-xs text-gray-600 mb-1">Point 2</p>
                          <p className="font-mono text-sm text-gray-800">
                            ({result.pair[1][0].toFixed(3)}, {result.pair[1][1].toFixed(3)})
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-green-700 mt-3">
                        Total points analyzed: {inputData?.length || 0}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                  <p className="font-semibold text-green-900 mb-2">Product:</p>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-sm text-green-800 font-mono break-all bg-white p-4 rounded-lg border border-green-300 whitespace-pre-wrap">
                      {result.product?.toString()}
                    </pre>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Length: {result.product?.toString().length} digits
                  </p>
                </div>
              )}
            </div>
          )}

          {steps.length > 0 && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Algorithm Steps</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Step {currentStep + 1} / {steps.length}
                  </span>
                  <button
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    disabled={currentStep === steps.length - 1}
                    className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 transition-all ${
                      idx === currentStep
                        ? 'bg-blue-50 border-blue-600 shadow-md'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="text-xs font-mono text-gray-500 mr-3">
                        {String(idx + 1).padStart(3, '0')}
                      </span>
                      <div className="flex-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          step.type === 'divide' ? 'bg-blue-100 text-blue-700' :
                          step.type === 'base' ? 'bg-green-100 text-green-700' :
                          step.type === 'merge' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {step.type.toUpperCase()}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">Depth: {step.depth}</span>
                        <p className="mt-2 text-sm text-gray-700">{step.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">File Format Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Closest Pair:</strong> Each line contains x,y coordinates (e.g., "123.45,678.90")</li>
                <li><strong>Integer Multiplication:</strong> Two lines, each containing one large integer</li>
                <li><strong>Minimum input size:</strong> 100+ points for Closest Pair, 100+ digits for Integer Multiplication</li>
                <li>Generated files meet minimum size requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivideConquerUI;
