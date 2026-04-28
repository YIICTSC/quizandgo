
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { Player } from '../types';
import { encodePlayerData, decodePlayerData } from '../services/vsService';
import { X, Camera, QrCode, Play, Copy, Check, Share2, AlertCircle, RefreshCw, FlipHorizontal, Edit3 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface QRManagerProps {
    player: Player;
    onOpponentLoaded: (opponent: Player) => void;
    onClose: () => void;
}

const QRManager: React.FC<QRManagerProps> = ({ player, onOpponentLoaded, onClose }) => {
    const [mode, setMode] = useState<'SHOW' | 'SCAN'>('SHOW');
    const [qrData, setQrData] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [qrImageUrl, setQrImageUrl] = useState<string>("");
    
    // Scanner refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scanRequestRef = useRef<number | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    // Camera selection state
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

    useEffect(() => {
        const encoded = encodePlayerData(player);
        setQrData(encoded);
        setImageError(false);
        setIsLoading(true);
    }, [player]);

    useEffect(() => {
        let cancelled = false;

        const buildQrImage = async () => {
            if (!qrData) {
                setQrImageUrl("");
                setIsLoading(false);
                return;
            }

            try {
                const dataUrl = await QRCode.toDataURL(qrData, {
                    errorCorrectionLevel: 'M',
                    margin: 2,
                    width: 320,
                    color: {
                        dark: '#111827',
                        light: '#ffffff'
                    }
                });
                if (!cancelled) {
                    setQrImageUrl(dataUrl);
                    setImageError(false);
                }
            } catch (error) {
                console.error('QR generation error:', error);
                if (!cancelled) {
                    setImageError(true);
                    setQrImageUrl("");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        setIsLoading(true);
        buildQrImage();

        return () => {
            cancelled = true;
        };
    }, [qrData]);

    // Handle Camera for Scanning
    useEffect(() => {
        if (mode === 'SCAN') {
            startCamera();
            updateDeviceList();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [mode, selectedDeviceId]);

    const updateDeviceList = async () => {
        try {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);
            
            // 初回、かつデバイスがまだ明示的に選択されていない場合
            if (videoDevices.length > 0 && !selectedDeviceId) {
                // 背面カメラと思われるデバイスを検索 (ラベルから推測)
                const backCamera = videoDevices.find(device => 
                    /back|rear|背面|後方|environment/i.test(device.label)
                );
                
                if (backCamera) {
                    setSelectedDeviceId(backCamera.deviceId);
                } else if (videoRef.current?.srcObject) {
                    // ラベルが空の場合などは、現在実際に使われているトラックからIDを取得
                    const stream = videoRef.current.srcObject as MediaStream;
                    const activeTrack = stream.getVideoTracks()[0];
                    if (activeTrack) {
                        const settings = activeTrack.getSettings();
                        if (settings.deviceId) {
                            setSelectedDeviceId(settings.deviceId);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error listing devices:", e);
        }
    };

    const switchCamera = () => {
        if (devices.length < 2) return;
        
        const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        const nextDevice = devices[nextIndex];
        
        stopCamera();
        setSelectedDeviceId(nextDevice.deviceId);
        audioService.playSound('select');
    };

    const startCamera = async () => {
        setScanError(null);
        try {
            // selectedDeviceId がない場合は理想的な向きとして "environment" (背面) を指定
            const constraints: MediaStreamConstraints = {
                video: selectedDeviceId 
                    ? { deviceId: { exact: selectedDeviceId } } 
                    : { facingMode: { ideal: "environment" } }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true"); 
                await videoRef.current.play();
                scanRequestRef.current = requestAnimationFrame(tick);
            }
        } catch (err: any) {
            console.error("Camera error:", err);
            setScanError("カメラへのアクセスに失敗しました。ブラウザの設定を確認してください。");
        }
    };

    const stopCamera = () => {
        if (scanRequestRef.current !== null) {
            cancelAnimationFrame(scanRequestRef.current);
            scanRequestRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const tick = () => {
        if (!videoRef.current || mode !== 'SCAN') return;

        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            if (canvas && video && jsQR) {
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (ctx) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    try {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });

                        if (code && code.data) {
                            handleCodeDetected(code.data);
                            return; // 成功時はループを抜ける
                        }
                    } catch (e) {
                        console.error("Analysis error", e);
                    }
                }
            }
        }
        scanRequestRef.current = requestAnimationFrame(tick);
    };

    const handleCodeDetected = (data: string) => {
        const opponent = decodePlayerData(data);
        if (opponent) {
            stopCamera();
            audioService.playSound('win');
            onOpponentLoaded(opponent);
        } else {
            // 無効なコードでもスキャンを継続
            scanRequestRef.current = requestAnimationFrame(tick);
        }
    };

    const handleCopy = () => {
        if (!qrData) return;
        navigator.clipboard.writeText(qrData);
        setCopied(true);
        audioService.playSound('select');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleManualInput = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const input = (formData.get('data') as string)?.trim();
        if (!input) return;

        const opponent = decodePlayerData(input);
        if (opponent) {
            audioService.playSound('win');
            onOpponentLoaded(opponent);
        } else {
            audioService.playSound('wrong');
            alert("無効なバトルコードです。");
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border-4 border-indigo-500 rounded-3xl w-full max-w-lg p-6 relative overflow-y-auto max-h-[95vh] shadow-[0_0_60px_rgba(79,70,229,0.5)] custom-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[210]">
                    <X size={28} />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center gap-3 italic tracking-tighter">
                        <QrCode size={32} className="text-indigo-400" /> VS SETUP
                    </h2>
                </div>

                {/* Mode Tabs */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-indigo-900/50 mb-6 shrink-0">
                    <button 
                        onClick={() => setMode('SHOW')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'SHOW' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Share2 size={16}/> 自分のQR
                    </button>
                    <button 
                        onClick={() => setMode('SCAN')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'SCAN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Camera size={16}/> 相手をスキャン
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    {mode === 'SHOW' ? (
                        <>
                            {/* QR Display Section */}
                            <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] group min-h-[250px] justify-center">
                                {qrData && !imageError ? (
                                    <div className="relative">
                                        {isLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white">
                                                <RefreshCw className="text-indigo-500 animate-spin" size={40} />
                                            </div>
                                        )}
                                        <img 
                                            src={qrImageUrl} 
                                            alt="Battle QR Code" 
                                            className={`w-48 h-48 md:w-64 md:h-64 object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                            onLoad={() => setIsLoading(false)}
                                            onError={() => {
                                                setImageError(true);
                                                setIsLoading(false);
                                            }}
                                        />
                                        <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-lg pointer-events-none group-hover:border-indigo-500/50 transition-colors"></div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-800 p-4 text-center">
                                        {imageError ? (
                                            <>
                                                <AlertCircle size={48} className="text-red-500 mb-2" />
                                                <p className="font-bold text-sm">QRコードの生成に失敗しました</p>
                                                <button onClick={() => { setImageError(false); setIsLoading(true); }} className="mt-3 text-indigo-600 font-bold text-xs underline">再試行</button>
                                            </>
                                        ) : (
                                            <div className="w-48 h-48 md:w-64 md:h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                                                <span className="text-gray-400 font-bold">GENERATING...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mt-4 flex flex-col items-center">
                                    <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <Share2 size={12}/> Your Battle QR
                                    </span>
                                </div>
                            </div>

                            {/* Copy Code Section */}
                            <div className="bg-black/60 p-4 rounded-xl border border-indigo-900/50">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Text Code</p>
                                    <button 
                                        onClick={handleCopy}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600/80 text-indigo-100 hover:bg-indigo-500 shadow-lg'}`}
                                    >
                                        {copied ? <Check size={12} /> : <Copy size={12} />}
                                        {copied ? 'COPIED!' : 'COPY CODE'}
                                    </button>
                                </div>
                                <div className="w-full bg-slate-800 rounded p-2 text-[9px] text-slate-400 font-mono break-all line-clamp-2 border border-slate-700 select-all">
                                    {qrData || "No data available"}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* SCAN MODE */
                        <div className="flex flex-col gap-4">
                            <div className="relative aspect-square w-full bg-black rounded-3xl overflow-hidden border-4 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                                {scanError ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                        <AlertCircle size={48} className="text-red-500 mb-4" />
                                        <p className="text-sm text-red-200 font-bold mb-4">{scanError}</p>
                                        <button 
                                            onClick={startCamera}
                                            className="bg-indigo-600 px-6 py-2 rounded-full font-bold text-sm"
                                        >
                                            再試行
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <video 
                                            ref={videoRef} 
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />
                                        
                                        {/* Scanner Overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Viewfinder Frame */}
                                            <div className="absolute inset-[15%] border-2 border-white/50 rounded-2xl">
                                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
                                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div>
                                                
                                                {/* Scanning Line Animation */}
                                                <div className="absolute left-2 right-2 h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)] animate-scan-line"></div>
                                            </div>
                                            
                                            {/* Darkened outside areas */}
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 15%, 15% 15%, 15% 85%, 85% 85%, 85% 15%, 0% 15%)' }}></div>
                                        </div>
                                        
                                        {/* Switch Camera Button */}
                                        {devices.length > 1 && (
                                            <button 
                                                onClick={switchCamera}
                                                className="absolute bottom-4 right-4 bg-indigo-600/80 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg border border-white/30 backdrop-blur-md transition-all active:scale-90 z-[220]"
                                                title="カメラを切り替える"
                                            >
                                                <RefreshCw size={24} />
                                            </button>
                                        )}

                                        <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                                            <span className="bg-black/60 px-4 py-1 rounded-full text-[10px] font-bold text-white border border-white/20 backdrop-blur-md">
                                                相手のQRコードを枠内に映してください
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="bg-indigo-600/10 p-4 rounded-2xl border-2 border-indigo-500/30">
                                <h3 className="text-[10px] text-indigo-300 font-black mb-3 uppercase tracking-widest flex items-center gap-2">
                                    <Edit3 size={12}/> OR PASTE CODE MANUALLY
                                </h3>
                                <form onSubmit={handleManualInput} className="flex gap-2">
                                    <input 
                                        name="data"
                                        type="text" 
                                        autoComplete="off"
                                        placeholder="バトルコードを入力"
                                        className="flex-1 bg-black border border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-400 transition-all placeholder:text-gray-600"
                                    />
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95">
                                        GO
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs font-bold underline underline-offset-4">
                        CANCEL AND BACK
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes scan-line {
                    0% { top: 15%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 85%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default QRManager;
