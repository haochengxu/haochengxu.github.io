import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";

interface Segment {
  name: string;
  duration: number;
  audioFile: string;
}

interface Preset {
  id: string;
  name: string;
  segments: Segment[];
  repeatTimes: number;
}

const SleepBreathCounter: React.FC = () => {
  // 版本号：每次修改预设数据结构或默认值时递增
  const PRESET_VERSION = "1.1";

  const [currentPage, setCurrentPage] = useState<"home" | "timer">("home");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [repeatTimes, setRepeatTimes] = useState(1);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [editingSegmentIndex, setEditingSegmentIndex] = useState(-1);
  const [segmentName, setSegmentName] = useState("");
  const [segmentDuration, setSegmentDuration] = useState("");
  const [newPresetName, setNewPresetName] = useState("");
  const [newRepeatTimes, setNewRepeatTimes] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Web Audio API 相关
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const audioFiles = [
    "/sleep-breath-counter/audio/ding-101492.mp3",
    "/sleep-breath-counter/audio/windchime1-7065.mp3",
    "/sleep-breath-counter/audio/metallophone-1-3-88146.mp3",
  ];

  // 加载预设和预加载音频
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 初始化 AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
      
      // 预加载和解码所有音频文件
      const loadAudioBuffers = async () => {
        for (const file of audioFiles) {
          try {
            const response = await fetch(file);
            const arrayBuffer = await response.arrayBuffer();
            if (audioContextRef.current) {
              const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
              audioBuffersRef.current.set(file, audioBuffer);
              console.log(`音频加载完成: ${file}`);
            }
          } catch (err) {
            console.error(`音频加载失败: ${file}`, err);
          }
        }
      };
      
      loadAudioBuffers();
      
      // 保留旧的 Audio 元素作为后备
      audioRef.current = new Audio();
      
      loadPresets();
    }
  }, []);

  const loadPresets = () => {
    // 检查版本号
    const savedVersion = localStorage.getItem("timer_presets_version");
    let savedPresets = localStorage.getItem("timer_presets");
    
    // 如果版本不匹配，清除旧数据
    if (savedVersion !== PRESET_VERSION) {
      localStorage.removeItem("timer_presets");
      savedPresets = null;
      console.log("检测到新版本，已清除旧数据");
    }
    
    if (!savedPresets) {
      const defaultPresets: Preset[] = [
        {
          id: "preset_1",
          name: "睡前呼吸",
          segments: [
            { name: "吸气", duration: 2, audioFile: audioFiles[0] },
            { name: "暂停", duration: 2, audioFile: audioFiles[1] },
            { name: "呼气", duration: 4, audioFile: audioFiles[2] },
          ],
          repeatTimes: 25,
        },
      ];
      localStorage.setItem("timer_presets", JSON.stringify(defaultPresets));
      localStorage.setItem("timer_presets_version", PRESET_VERSION);
      setPresets(defaultPresets);
    } else {
      setPresets(JSON.parse(savedPresets));
    }
  };

  const resetToDefaults = () => {
    if (confirm("确定要恢复默认设置吗？这将清除所有自定义方案。")) {
      localStorage.removeItem("timer_presets");
      localStorage.removeItem("timer_presets_version");
      loadPresets();
      setCurrentPreset(null);
      setSegments([]);
      alert("已恢复默认设置");
    }
  };

  const playBeep = (audioFile?: string) => {
    const file = audioFile || audioFiles[0];
    
    // 尝试使用 Web Audio API
    if (audioContextRef.current && audioBuffersRef.current.has(file)) {
      try {
        // 激活 AudioContext（iOS 需要）
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        
        // 停止之前的音频
        if (currentSourceRef.current) {
          try {
            currentSourceRef.current.stop();
          } catch (e) {
            // 忽略错误
          }
        }
        
        // 创建新的音频源
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffersRef.current.get(file)!;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        currentSourceRef.current = source;
        
        console.log(`使用 Web Audio API 播放: ${file}`);
        return;
      } catch (err) {
        console.log("使用 Web Audio API 失败，回退到 HTML Audio:", err);
      }
    }
    
    // 回退到传统 HTML Audio
    if (audioRef.current) {
      audioRef.current.src = file;
      audioRef.current.play().catch((err) => {
        console.log("音频播放被阻止:", err);
      });
    }
  };

  const loadPreset = (presetId: string) => {
    // 从 localStorage 读取最新数据
    const savedPresets = localStorage.getItem("timer_presets");
    const currentPresets = savedPresets ? JSON.parse(savedPresets) : presets;
    
    const preset = currentPresets.find((p) => p.id === presetId);
    if (preset) {
      setCurrentPreset(preset);
      setSegments([...preset.segments]);
      setRepeatTimes(preset.repeatTimes);
      setCurrentSegment(0);
      setCurrentRepeat(0);
      setTimeLeft(preset.segments[0]?.duration * 1000 || 0);
      setIsRunning(false);
      setIsPaused(false);
      setCurrentPage("timer");
      
      // 同步更新 presets state
      setPresets(currentPresets);
      
      // 预热第一个音频，确保点击开始时能立即播放
      // 移动端优化：触摸交互时尝试激活 AudioContext
      if (preset.segments[0]) {
        // 激活 Web Audio API
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('AudioContext 已激活');
          }).catch(err => {
            console.log('AudioContext 激活失败:', err);
          });
        }
        
        // 同时预热 HTML Audio 作为后备
        if (audioRef.current) {
          audioRef.current.src = preset.segments[0].audioFile;
          audioRef.current.volume = 0.01;
          audioRef.current.load();
          audioRef.current.play().then(() => {
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
            audioRef.current!.volume = 1;
          }).catch(() => {
            audioRef.current!.volume = 1;
          });
        }
      }
    }
  };

  const deletePreset = (presetId: string) => {
    if (confirm("确定删除此方案吗？")) {
      const newPresets = presets.filter((p) => p.id !== presetId);
      localStorage.setItem("timer_presets", JSON.stringify(newPresets));
      setPresets(newPresets);
    }
  };

  const createPreset = () => {
    if (!newPresetName.trim()) {
      alert("请输入方案名称");
      return;
    }
    const newPreset: Preset = {
      id: `preset_${Date.now()}`,
      name: newPresetName,
      segments: [],
      repeatTimes: 1,
    };
    const newPresets = [...presets, newPreset];
    localStorage.setItem("timer_presets", JSON.stringify(newPresets));
    setPresets(newPresets);
    setNewPresetName("");
    setShowPresetModal(false);
    loadPreset(newPreset.id);
  };

  const saveCurrentPreset = () => {
    if (!currentPreset) return;
    // 从 localStorage 读取最新数据，避免使用过期的 state
    const savedPresets = localStorage.getItem("timer_presets");
    const currentPresets = savedPresets ? JSON.parse(savedPresets) : presets;
    
    const newPresets = currentPresets.map((p) =>
      p.id === currentPreset.id
        ? { ...p, segments: [...segments], repeatTimes }
        : p
    );
    localStorage.setItem("timer_presets", JSON.stringify(newPresets));
    setPresets(newPresets);
    
    // 同步更新 currentPreset
    const updatedPreset = newPresets.find(p => p.id === currentPreset.id);
    if (updatedPreset) {
      setCurrentPreset(updatedPreset);
    }
  };

  const startTimer = () => {
    if (segments.length === 0) {
      alert("请先添加时间段");
      return;
    }
    
    // 开始时确保倒计时从当前段落时长开始
    setTimeLeft(segments[currentSegment]?.duration * 1000 || 0);
    
    // 立即播放音频（Web Audio API 几乎没有延迟）
    playBeep(segments[currentSegment]?.audioFile);
    
    // 立即启动计时器
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setCurrentSegment(0);
    setCurrentRepeat(0);
    setTimeLeft(segments[0]?.duration * 1000 || 0);
  };

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 0) {
            return Math.max(prev - 50, 0);
          }
          // 段落结束，需要切换到下一个段落
          // 返回 0 触发段落切换逻辑
          return 0;
        });
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // 未运行时保持倒计时与当前段落时长一致
  useEffect(() => {
    if (!isRunning && segments.length > 0) {
      setTimeLeft(segments[currentSegment]?.duration * 1000 || 0);
    }
  }, [isRunning, segments, currentSegment]);

  // 监听 timeLeft，当为 0 时切换段落
  useEffect(() => {
    if (timeLeft === 0 && isRunning && !isPaused && segments.length > 0) {
      const nextSeg = currentSegment + 1;
      if (nextSeg >= segments.length) {
        // 一轮结束
        const nextRep = currentRepeat + 1;
        if (nextRep < repeatTimes) {
          // 开始新一轮
          setCurrentRepeat(nextRep);
          setCurrentSegment(0);
          setTimeLeft(segments[0]?.duration * 1000 || 0);
          playBeep(segments[0]?.audioFile);
        } else {
          // 全部完成
          stopTimer();
          alert("计时完成！");
        }
      } else {
        // 进入下一个段落
        setCurrentSegment(nextSeg);
        setTimeLeft(segments[nextSeg]?.duration * 1000 || 0);
        playBeep(segments[nextSeg]?.audioFile);
      }
    }
  }, [timeLeft, isRunning, isPaused, currentSegment, currentRepeat, segments, repeatTimes]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const addSegment = () => {
    setEditingSegmentIndex(-1);
    setSegmentName("");
    setSegmentDuration("");
    setShowSegmentModal(true);
  };

  const editSegment = (index: number) => {
    setEditingSegmentIndex(index);
    setSegmentName(segments[index].name);
    setSegmentDuration(segments[index].duration.toString());
    setShowSegmentModal(true);
  };

  const deleteSegment = (index: number) => {
    if (confirm("确定删除此时间段吗？")) {
      const updatedSegments = segments.filter((_, i) => i !== index);
      setSegments(updatedSegments);
      
      // 使用更新后的 segments 立即保存
      if (currentPreset) {
        const savedPresets = localStorage.getItem("timer_presets");
        const currentPresets = savedPresets ? JSON.parse(savedPresets) : presets;
        
        const newPresets = currentPresets.map((p) =>
          p.id === currentPreset.id
            ? { ...p, segments: updatedSegments, repeatTimes }
            : p
        );
        localStorage.setItem("timer_presets", JSON.stringify(newPresets));
        setPresets(newPresets);
        
        const updatedPreset = newPresets.find(p => p.id === currentPreset.id);
        if (updatedPreset) {
          setCurrentPreset(updatedPreset);
        }
      }
    }
  };

  const confirmSegment = () => {
    if (!segmentName.trim() || !segmentDuration) {
      alert("请填写完整信息");
      return;
    }
    const duration = parseFloat(segmentDuration);
    if (duration <= 0) {
      alert("时长必须大于0");
      return;
    }

    const newSegment: Segment = {
      name: segmentName,
      duration,
      audioFile: editingSegmentIndex >= 0 
        ? segments[editingSegmentIndex].audioFile // 编辑时保留原有音频文件
        : audioFiles[segments.length % audioFiles.length], // 新增时分配新音频文件
    };

    let updatedSegments;
    if (editingSegmentIndex >= 0) {
      updatedSegments = [...segments];
      updatedSegments[editingSegmentIndex] = newSegment;
    } else {
      updatedSegments = [...segments, newSegment];
    }
    
    setSegments(updatedSegments);
    setShowSegmentModal(false);
    
    // 使用更新后的 segments 立即保存
    if (currentPreset) {
      const savedPresets = localStorage.getItem("timer_presets");
      const currentPresets = savedPresets ? JSON.parse(savedPresets) : presets;
      
      const newPresets = currentPresets.map((p) =>
        p.id === currentPreset.id
          ? { ...p, segments: updatedSegments, repeatTimes }
          : p
      );
      localStorage.setItem("timer_presets", JSON.stringify(newPresets));
      setPresets(newPresets);
      
      const updatedPreset = newPresets.find(p => p.id === currentPreset.id);
      if (updatedPreset) {
        setCurrentPreset(updatedPreset);
      }
    }
  };

  const confirmRepeat = () => {
    const times = parseInt(newRepeatTimes);
    if (times < 1) {
      alert("重复次数至少为1");
      return;
    }
    setRepeatTimes(times);
    setShowRepeatModal(false);
    
    // 使用更新后的 repeatTimes 立即保存
    if (currentPreset) {
      const savedPresets = localStorage.getItem("timer_presets");
      const currentPresets = savedPresets ? JSON.parse(savedPresets) : presets;
      
      const newPresets = currentPresets.map((p) =>
        p.id === currentPreset.id
          ? { ...p, segments: [...segments], repeatTimes: times }
          : p
      );
      localStorage.setItem("timer_presets", JSON.stringify(newPresets));
      setPresets(newPresets);
      
      const updatedPreset = newPresets.find(p => p.id === currentPreset.id);
      if (updatedPreset) {
        setCurrentPreset(updatedPreset);
      }
    }
  };

  return (
    <>
      <Head>
        <title>多段计时器 - 呼吸练习</title>
      </Head>
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
      `}</style>
      <div className="min-h-screen p-5">
        {currentPage === "home" ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">多段计时器</h1>
              <p className="text-white/80">呼吸练习</p>
            </div>

            <div className="space-y-4 mb-6">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-white rounded-2xl p-5 shadow-lg cursor-pointer hover:scale-[0.98] transition-transform"
                  onClick={() => loadPreset(preset.id)}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {preset.name === "睡前呼吸" ? "🌙" : "⏱️"}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        {preset.name}
                      </div>
                    </div>
                    <button
                      className="text-2xl text-gray-400 hover:text-red-500 w-8 h-8 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {preset.segments.length} 个时间段 · 重复 {preset.repeatTimes}{" "}
                    次（可自由配置）
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                className="w-full bg-white/20 backdrop-blur text-white rounded-2xl p-4 flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
                onClick={() => setShowPresetModal(true)}
              >
                <span className="text-2xl">+</span>
                <span>创建新方案</span>
              </button>
              <button
                className="w-full bg-white/10 backdrop-blur text-white rounded-2xl p-3 text-sm hover:bg-white/20 transition-colors"
                onClick={resetToDefaults}
              >
                恢复默认设置
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 relative">
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm"
                onClick={() => {
                  stopTimer();
                  setCurrentPage("home");
                }}
              >
                ← 返回
              </button>
              <h2 className="text-3xl font-bold text-white">
                {currentPreset?.name}
              </h2>
            </div>

            <div className="bg-white rounded-3xl p-8 mb-6 text-center">
              <div className="text-gray-600 mb-2">
                第 {currentRepeat + 1} / {repeatTimes} 轮
              </div>
              <div className="text-2xl font-semibold text-purple-600 mb-4">
                {segments[currentSegment]?.name || "准备开始"}
              </div>
              <div className="text-6xl font-bold text-gray-800 mb-4">
                {formatTime(timeLeft)}
              </div>
              <div className="text-gray-600">
                段落 {currentSegment + 1} / {segments.length}
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              {!isRunning ? (
                <button
                  className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-green-600 transition-colors"
                  onClick={startTimer}
                >
                  开始
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button
                      className="flex-1 bg-yellow-500 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-yellow-600 transition-colors"
                      onClick={pauseTimer}
                    >
                      暂停
                    </button>
                  ) : (
                    <button
                      className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-blue-600 transition-colors"
                      onClick={resumeTimer}
                    >
                      继续
                    </button>
                  )}
                  <button
                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-red-600 transition-colors"
                    onClick={stopTimer}
                  >
                    停止
                  </button>
                </>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">时间段设置</h3>
                <button
                  className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm hover:bg-purple-600 transition-colors"
                  onClick={addSegment}
                >
                  + 添加
                </button>
              </div>
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-xl flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{segment.name}</div>
                      <div className="text-sm text-gray-600">
                        {segment.duration} 秒
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                        onClick={() => editSegment(index)}
                      >
                        修改
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                        onClick={() => deleteSegment(index)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">重复次数</span>
                  <div className="text-2xl font-bold text-purple-600 mt-2">{repeatTimes} 次</div>
                </div>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    setNewRepeatTimes(repeatTimes.toString());
                    setShowRepeatModal(true);
                  }}
                >
                  修改
                </button>
              </div>
            </div>

            <div className="text-center text-white/80 text-sm">
              💡 点击修改按钮修改时间段，点击删除按钮移除时间段
            </div>
          </div>
        )}

        {/* 段落弹窗 */}
        {showSegmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">
                {editingSegmentIndex >= 0 ? "修改时间段" : "添加时间段"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">名称</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="例如：工作"
                    maxLength={10}
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    时长（秒）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="例如：30"
                    value={segmentDuration}
                    onChange={(e) => setSegmentDuration(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50"
                  onClick={() => setShowSegmentModal(false)}
                >
                  取消
                </button>
                <button
                  className="flex-1 bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600"
                  onClick={confirmSegment}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 重复次数弹窗 */}
        {showRepeatModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">设置重复次数</h3>
              <div>
                <label className="block text-sm font-medium mb-2">
                  重复次数
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                  placeholder="至少1次"
                  min="1"
                  value={newRepeatTimes}
                  onChange={(e) => setNewRepeatTimes(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50"
                  onClick={() => setShowRepeatModal(false)}
                >
                  取消
                </button>
                <button
                  className="flex-1 bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600"
                  onClick={confirmRepeat}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 创建方案弹窗 */}
        {showPresetModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">创建新方案</h3>
              <div>
                <label className="block text-sm font-medium mb-2">
                  方案名称
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                  placeholder="例如：番茄工作法"
                  maxLength={20}
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50"
                  onClick={() => setShowPresetModal(false)}
                >
                  取消
                </button>
                <button
                  className="flex-1 bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600"
                  onClick={createPreset}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SleepBreathCounter;
