import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  Download, 
  Video, 
  Music, 
  Clock, 
  HardDrive, 
  FileCheck,
  Maximize,
  PictureInPicture2,
  Gauge,
  Sparkles,
  Volume1
} from 'lucide-react';
import { FileNode } from '../types';
import { formatFileSize, formatDate } from '../utils/fileUtils';

interface MediaViewerProps {
  file: FileNode;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ file }) => {
  const isVideo = file.category === 'video';
  const isAudio = file.category === 'audio';

  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load media blob URL
  useEffect(() => {
    let urlToRevoke: string | null = null;
    let isMounted = true;

    async function loadMedia() {
      setLoading(true);
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setVideoDimensions(null);

      try {
        if (file.fileObject) {
          const url = URL.createObjectURL(file.fileObject);
          urlToRevoke = url;
          if (isMounted) setMediaUrl(url);
        } else if (file.handle && file.handle.kind === 'file') {
          const f = await (file.handle as FileSystemFileHandle).getFile();
          const url = URL.createObjectURL(f);
          urlToRevoke = url;
          if (isMounted) setMediaUrl(url);
        } else if (typeof file.content === 'string' && file.content.length > 0) {
          if (file.content.startsWith('http') || file.content.startsWith('data:') || file.content.startsWith('blob:')) {
            if (isMounted) setMediaUrl(file.content);
          } else {
            // String content or raw text base64
            const blob = new Blob([file.content], { type: isVideo ? 'video/mp4' : 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            urlToRevoke = url;
            if (isMounted) setMediaUrl(url);
          }
        } else if (file.content instanceof ArrayBuffer) {
          const blob = new Blob([file.content], { type: isVideo ? 'video/mp4' : 'audio/mp3' });
          const url = URL.createObjectURL(blob);
          urlToRevoke = url;
          if (isMounted) setMediaUrl(url);
        } else {
          // Sample fallback online links for previewing without direct file object
          if (isVideo) {
            setMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
          } else {
            setMediaUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
          }
        }
      } catch (err: any) {
        console.error('Failed to load media object:', err);
        if (isMounted) setError('无法解析或读取媒体文件');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMedia();

    return () => {
      isMounted = false;
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [file]);

  // Handle Play / Pause Toggle
  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(err => console.warn('Play interrupted:', err));
    }
  };

  // Time format helper (00:00 or 00:00:00)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Seek time change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (mediaRef.current) {
      mediaRef.current.currentTime = targetTime;
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (mediaRef.current) {
      mediaRef.current.volume = newVol;
      mediaRef.current.muted = newVol === 0;
    }
  };

  // Mute Toggle
  const toggleMute = () => {
    if (!mediaRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    mediaRef.current.muted = nextMute;
  };

  // Playback Rate Change
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
    }
  };

  // Loop Toggle
  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (mediaRef.current) {
      mediaRef.current.loop = !isLooping;
    }
  };

  // Fullscreen toggle for video
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.warn(err));
    } else {
      containerRef.current.requestFullscreen().catch(err => console.warn(err));
    }
  };

  // Picture in Picture for video
  const togglePiP = async () => {
    if (!mediaRef.current || !isVideo) return;
    const video = mediaRef.current as HTMLVideoElement;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Download media
  const handleDownload = () => {
    if (!mediaUrl) return;
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when writing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (mediaRef.current) {
          mediaRef.current.currentTime = Math.max(0, mediaRef.current.currentTime - 5);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (mediaRef.current) {
          mediaRef.current.currentTime = Math.min(duration, mediaRef.current.currentTime + 5);
        }
      } else if (e.key.toLowerCase() === 'm') {
        toggleMute();
      } else if (e.key.toLowerCase() === 'f' && isVideo) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, isMuted, isVideo]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-y-auto selection:bg-blue-500/30">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 ${isVideo ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {isVideo ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100 truncate flex items-center gap-2">
              <span>{file.name}</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                {file.extension || (isVideo ? 'VIDEO' : 'AUDIO')}
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-zinc-500" />
                {formatFileSize(file.size)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                {formatDate(file.lastModified)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all active:scale-95 cursor-pointer border border-zinc-700/50"
            title="下载媒体文件"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">下载文件</span>
          </button>
        </div>
      </div>

      {/* Media Main Display Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-0 relative">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-zinc-400 animate-pulse">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs font-medium">正在准备媒体资源...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 text-rose-400 p-6 bg-rose-950/20 rounded-2xl border border-rose-900/50 max-w-md text-center">
            <FileCheck className="w-8 h-8 text-rose-500" />
            <span className="text-sm font-medium">{error}</span>
            <p className="text-xs text-zinc-500">可能受浏览器安全限制或格式暂不支持直接解析。</p>
          </div>
        )}

        {!loading && !error && mediaUrl && (
          <div 
            ref={containerRef} 
            className="w-full max-w-4xl flex flex-col items-center justify-center bg-zinc-900/80 rounded-3xl border border-zinc-800/80 shadow-2xl overflow-hidden group"
          >
            {/* Video View */}
            {isVideo && (
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={mediaRef as React.RefObject<HTMLVideoElement>}
                  src={mediaUrl}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                  onTimeUpdate={() => {
                    if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
                  }}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    setDuration(video.duration);
                    setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Big Center Play Button Overlay */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <Play className="w-8 h-8 ml-1 fill-white" />
                  </button>
                )}
              </div>
            )}

            {/* Audio View - Stylish Card */}
            {isAudio && (
              <div className="w-full p-8 sm:p-12 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950">
                {/* Audio Album/Vinyl Art Visualizer */}
                <div className="relative group/album">
                  <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-1 shadow-2xl transition-transform duration-700 ${isPlaying ? 'animate-spin-slow scale-105' : 'scale-100'}`}>
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center border-4 border-zinc-900 relative overflow-hidden">
                      {/* Equalizer Rings */}
                      <div className="absolute inset-0 rounded-full border border-teal-500/20 scale-75" />
                      <div className="absolute inset-0 rounded-full border border-teal-500/10 scale-50" />
                      <Music className="w-12 h-12 text-teal-400" />
                    </div>
                  </div>

                  {/* Playing Waveform Animated Bar Indicator */}
                  {isPlaying && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6 px-3 py-1 bg-zinc-900/90 rounded-full border border-teal-500/30 backdrop-blur-md">
                      <span className="w-1 bg-teal-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 bg-teal-400 rounded-full animate-bounce h-5" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 bg-teal-400 rounded-full animate-bounce h-2" style={{ animationDelay: '300ms' }} />
                      <span className="w-1 bg-teal-400 rounded-full animate-bounce h-6" style={{ animationDelay: '200ms' }} />
                      <span className="w-1 bg-teal-400 rounded-full animate-bounce h-4" style={{ animationDelay: '100ms' }} />
                    </div>
                  )}
                </div>

                {/* Audio Details */}
                <div className="text-center space-y-1 max-w-md">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-100 truncate">{file.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {formatFileSize(file.size)} • {duration ? formatTime(duration) : '格式音频'}
                  </p>
                </div>

                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  src={mediaUrl}
                  className="hidden"
                  onTimeUpdate={() => {
                    if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
                  }}
                  onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            )}

            {/* Common Media Controls Toolbar */}
            <div className="w-full p-4 sm:p-5 bg-zinc-900/90 border-t border-zinc-800/80 flex flex-col gap-3">
              {/* Progress Slider Bar */}
              <div className="flex items-center gap-3 w-full">
                <span className="text-xs font-mono text-zinc-400 shrink-0 w-12 text-right">
                  {formatTime(currentTime)}
                </span>

                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                />

                <span className="text-xs font-mono text-zinc-400 shrink-0 w-12">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls & Options Row */}
              <div className="flex items-center justify-between gap-2">
                {/* Left: Play/Pause & Loop */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-600/30"
                    title={isPlaying ? "暂停 (Space)" : "播放 (Space)"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>

                  <button
                    onClick={toggleLoop}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${isLooping ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    title={isLooping ? "已开启单曲循环" : "开启循环播放"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5 ml-2 group/vol">
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
                      title={isMuted ? "取消静音 (M)" : "静音 (M)"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Right: Speed Selector, PIP, Fullscreen */}
                <div className="flex items-center gap-2">
                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-zinc-800/80 px-2 py-1 rounded-xl border border-zinc-700/50 text-xs">
                    <Gauge className="w-3.5 h-3.5 text-zinc-400" />
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] transition-all cursor-pointer ${
                          playbackRate === rate 
                            ? 'bg-blue-600 text-white font-bold' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* PIP for Video */}
                  {isVideo && (
                    <button
                      onClick={togglePiP}
                      className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
                      title="画中画模式"
                    >
                      <PictureInPicture2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Fullscreen for Video */}
                  {isVideo && (
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
                      title="全屏模式 (F)"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/60 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            支持常用音视频原生硬件加速解码与高保真流畅播放
          </span>
          {videoDimensions && (
            <span className="font-mono bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50 text-zinc-300">
              分辨率: {videoDimensions.width} × {videoDimensions.height}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>快捷键: [空格] 播放/暂停</span>
          <span>[←/→] 快退/快进5s</span>
          <span>[M] 静音</span>
          {isVideo && <span>[F] 全屏</span>}
        </div>
      </div>
    </div>
  );
};
