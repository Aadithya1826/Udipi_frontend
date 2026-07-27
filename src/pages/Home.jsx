import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Html5Qrcode } from 'html5-qrcode'
import '../styles/home.css'
import dataudipiTitleImg from '../assets/images/Dataudupi-Title.png'
import dineinLogoImg from '../assets/images/dinein-logo.png'
import takeawayLogoImg from '../assets/images/takeaway-logo.png'

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !navigator.mediaDevices.getUserMedia.isPatched) {
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    const stream = await originalGetUserMedia(constraints);
    window.activeCameraStreams = window.activeCameraStreams || new Set();
    window.activeCameraStreams.add(stream);
    return stream;
  };
  navigator.mediaDevices.getUserMedia.isPatched = true;
}
function Home() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { tableNumber, setTableNumber, clearAllCarts } = useCart()

  const [showScanner, setShowScanner] = useState(false)
  const [manualTable, setManualTable] = useState('')
  const [scannerError, setScannerError] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const qrCodeInstanceRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDineInClick = () => {
    setShowScanner(true)
    setScannerError('')
    setManualTable('')
  }

  useEffect(() => {
    const handleOpenScanner = () => {
      handleDineInClick();
    };
    document.addEventListener('open-qr-scanner', handleOpenScanner);
    return () => {
      document.removeEventListener('open-qr-scanner', handleOpenScanner);
    };
  }, []);

  const stopAllCameraTracks = () => {
    if (window.activeCameraStreams) {
      window.activeCameraStreams.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
      window.activeCameraStreams.clear();
    }
    try {
      const videos = document.querySelectorAll('video')
      videos.forEach(video => {
        if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
          video.srcObject.getTracks().forEach(track => {
            track.stop()
          })
          video.srcObject = null
        }
      })
    } catch (e) {
      console.error("Error manually stopping camera tracks:", e)
    }
  }

  const handleCloseScanner = async () => {
    stopAllCameraTracks()
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop()
        }
        await qrCodeInstanceRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner on close:", err)
      }
      qrCodeInstanceRef.current = null
    }
    setShowScanner(false)
  }

  const parseTableFromQR = (data) => {
    try {
      if (data.includes('?')) {
        const queryString = data.split('?')[1]
        const params = new URLSearchParams(queryString)
        const tableVal = params.get('table')
        if (tableVal) {
          return formatTableNumber(tableVal)
        }
      }
    } catch (e) {
      console.error("Error parsing QR URL:", e)
    }
    return formatTableNumber(data)
  }

  const formatTableNumber = (val) => {
    const clean = val.trim().toUpperCase()
    if (/^T-\d+$/.test(clean)) {
      return clean.replace('T-', '')
    }
    if (/^T\d+$/.test(clean)) {
      return clean.replace('T', '').padStart(2, '0')
    }
    const digits = clean.replace(/\D/g, '')
    if (digits) {
      return digits.padStart(2, '0')
    }
    return '06'
  }

  const handleScanSuccess = async (decodedText) => {
    stopAllCameraTracks()
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop()
        }
        await qrCodeInstanceRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner on success:", err)
      }
      qrCodeInstanceRef.current = null
    }
    const tableNum = parseTableFromQR(decodedText)
    setTableNumber(tableNum)
    localStorage.setItem('active_table_number', tableNum)
    setShowScanner(false)
    navigate('/dine-in')
  }

  const handleManualSubmit = async () => {
    if (!manualTable.trim()) {
      alert("Please enter a valid table number.")
      return
    }
    stopAllCameraTracks()
    if (qrCodeInstanceRef.current) {
      try {
        if (qrCodeInstanceRef.current.isScanning) {
          await qrCodeInstanceRef.current.stop()
        }
        await qrCodeInstanceRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner on manual submit:", err)
      }
      qrCodeInstanceRef.current = null
    }
    const tableNum = formatTableNumber(manualTable)
    setTableNumber(tableNum)
    localStorage.setItem('active_table_number', tableNum)
    setShowScanner(false)
    navigate('/dine-in')
  }

  useEffect(() => {
    let active = true
    let html5QrCode = null

    if (showScanner) {
      const timer = setTimeout(() => {
        if (!active) return
        
        try {
          html5QrCode = new Html5Qrcode("qr-reader")
          qrCodeInstanceRef.current = html5QrCode
          
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              if (active) {
                handleScanSuccess(decodedText)
              }
            },
            () => {}
          ).then(() => {
            // If the cleanup happened while start() was pending
            if (!active && html5QrCode) {
              stopAllCameraTracks()
              if (html5QrCode.isScanning) {
                html5QrCode.stop()
                  .then(() => {
                    html5QrCode.clear()
                  })
                  .catch(err => console.error("Stop failed on late cleanup:", err))
              } else {
                stopAllCameraTracks()
              }
            }
          }).catch((err) => {
            if (active) {
              console.error("Camera start error:", err)
              setScannerError("Could not access camera. Please enter table number manually.")
            }
          })
        } catch (e) {
          console.error("Scanner setup error:", e)
          setScannerError("Scanner initialization failed. Please use manual entry.")
        }
      }, 300)

      return () => {
        clearTimeout(timer)
        active = false
        stopAllCameraTracks()
        if (html5QrCode) {
          try {
            if (html5QrCode.isScanning) {
              html5QrCode.stop()
                .then(() => {
                  html5QrCode.clear()
                })
                .catch(err => console.error("Scanner stop error:", err))
            }
          } catch (e) {
            console.error("Scanner cleanup error:", e)
          }
        }
      }
    }
  }, [showScanner])

  return (
    <div className="app-container home-page-container">
      <div className="background-image"></div>
      <Header tableNumber={tableNumber} showFullHeader={true} useTitleImage={false} showDateTime={false} hideTableIndicator={true} />
      
      <main className="main-content">
        <h2 className="welcome-text">{t('welcome')}</h2>
        <div className="main-title">
          <img src={dataudipiTitleImg} alt="Data Udipi" className="title-image" />
        </div>
        <p className="subtitle">{t('excellence')}</p>

        <div className="order-section">
          <h3 className="order-text">{t('orderHere')}</h3>
          <div className="action-buttons">
            <button className="action-btn" onClick={handleDineInClick}>
              <img src={dineinLogoImg} alt="Dine In Icon" className="btn-icon-img" />
              <span>{t('dineIn')}</span>
            </button>
            <button className="action-btn" onClick={() => {
              navigate('/take-away')
            }}>
              <img src={takeawayLogoImg} alt="Take Away Icon" className="btn-icon-img" />
              <span>{t('takeAway')}</span>
            </button>
          </div>
        </div>
      </main>

      {showScanner && (
        <div className="scanner-modal-overlay">
          <div className="scanner-modal-content">
            <button className="scanner-modal-close" onClick={handleCloseScanner}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <h4 className="scanner-modal-title">Scan Table QR Code</h4>
            <p className="scanner-modal-subtitle">Align the QR code on your table to start ordering</p>

            <div className="qr-reader-container">
              <div id="qr-reader"></div>
              <div className="qr-scanner-viewfinder">
                <div className="viewfinder-box">
                  <div className="scan-laser"></div>
                </div>
              </div>
            </div>

            {scannerError && (
              <div className="scanner-error-msg">{scannerError}</div>
            )}

            <div className="scanner-manual-card">
              <h5 className="manual-card-title">Unable to scan?</h5>
              <p className="manual-card-subtitle">Enter the table number manually from your table card</p>
              <div className="manual-input-group">
                <input 
                  type="text" 
                  className="manual-table-input" 
                  placeholder="Table No. (e.g. 05)" 
                  value={manualTable}
                  onChange={(e) => setManualTable(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <button className="manual-table-btn" onClick={handleManualSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Home
