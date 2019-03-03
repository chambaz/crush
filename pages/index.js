import { useEffect, useState, useRef } from 'react'
import styled from '@emotion/styled'
import anime from 'animejs'
import axios from 'axios'

const Page = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100vw',
  height: '100vh',
  flexDirection: 'column',
  margin: 0,
  position: 'absolute',
  top: 0,
  left: 0,
  background: 'black',
  fontFamily: 'Menlo',
  overflow: 'hidden'
})

const Intro = styled.p(props => ({
  display: props.display,
  fontSize: 40,
  color: '#fff'
}))

const Letter = styled.h2(props => ({
  fontSize: 120,
  transition: '3s',
  left: `${props.left}px`,
  position: 'relative',
  color: '#fff',
  transform: `translateX(${props.translateX}px) translateZ(0)`,
  opacity: props.opacity
}))

const Blob = styled.svg({
  width: 600,
  height: 600,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%) scale(2)',
  fill: '#cf00a3',
  mixBlendMode: 'overlay'
})

const Video = styled.video(props => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  objectFit: 'cover',
  filter: `hue-rotate(${props.currentHue}deg)`,
  opacity: props.opacity,
  transition: '1s'
}))

function Home() {
  const [rotation, seRotation] = useState({})
  const [currentHue, setCurrentHue] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const video = useRef(null)

  // on window load
  useEffect(() => {
    // store device rotation data in state
    window.ondevicemotion = function(event) {
      seRotation(event.rotationRate)
    }
  }, [])

  // play audio and pipe through WebAudio analyzer node
  function play() {
    if (playing) {
      return
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext
    const context = new AudioContext()
    const source = context.createBufferSource()
    const analyzer = context.createAnalyser()

    setLoading(true)

    // frequency analyzer with 64 segments
    analyzer.fftSize = 128
    let dataArray = new Uint8Array(analyzer.frequencyBinCount)

    // fetch mp3
    axios
      .get('/static/kingdom.mp3', {
        responseType: 'arraybuffer'
      })
      .then(arrayBuffer => {
        // decode and pipe through WebAudio
        context.decodeAudioData(arrayBuffer.data, audioBuffer => {
          source.buffer = audioBuffer
          source.connect(analyzer)
          analyzer.connect(context.destination)

          setLoading(false)
          setPlaying(true)

          // play buffer
          source.start()

          // play video
          video.current.play()

          // kick off analysis
          analyze(analyzer, dataArray)

          // when audio ends refresh page
          // TODO: improve ending
          source.onended = () => {
            setTimeout(() => {
              window.location.reload()
            }, 3500)
          }
        })
      })
  }

  // analyze audio buffer
  function analyze(analyzer, dataArray) {
    analyzer.getByteFrequencyData(dataArray)

    // take middle segments of audio analysis
    let arr = []
    dataArray.slice(8, 48).forEach((bucket, index) => {
      arr[index] = bucket
    })

    // shitty beat detection
    // TODO: improve beat detection
    if (arr[5] > 180 && !animating) {
      animate()
    }

    // recursive analysis
    requestAnimationFrame(() => {
      analyze(analyzer, dataArray)
    })
  }

  // animate blob SVG and hue shift on video
  function animate() {
    // blog shapes
    const shapes = [
      {
        value:
          'M73.8,-145C90.6,-104,95.8,-102.75,7,-49.9C109.5,-24.7,118.1,-3.2,134.7,33.4C151.2,70,175.7,121.8,166.6,159.3C157.4,196.9,114.5,220.3,78.2,201.3C41.9,182.3,12.2,120.9,-14,92.6C-40.1,64.3,-62.8,69.2,-99.6,65C-136.4,60.8,-187.5,47.5,-189.3,27.9C-191.2,8.2,-143.8,-17.9,-126.8,-59.1C-109.9,-100.3,-123.3,-156.6,-107.3,-197.9C-91.2,-239.2,-45.6,-265.6,-8.6,-252.3C28.5,-239,56.9,-185.9,73.8,-145Z'
      },
      {
        value:
          'M102,-171.5C123.2,-145,125.3,-101.6,129.7,-66.6C134.1,-31.7,140.8,-5.2,140.3,22.5C139.9,50.2,132.3,79.1,115.2,101C98.1,122.9,71.4,137.7,40.5,154.3C9.6,170.8,-25.6,189,-49.5,177.8C-73.3,166.5,-85.8,125.8,-112.6,96.6C-139.4,67.4,-180.6,49.6,-206.2,16.3C-231.8,-17.1,-241.9,-66.1,-230.3,-110.9C-218.8,-155.8,-185.6,-196.5,-143.6,-213.5C-101.6,-230.5,-50.8,-223.7,-5.2,-215.6C40.4,-207.5,80.7,-198,102,-171.5Z'
      },
      {
        value:
          'M53,-74C78.6,-66,116.2,-68.1,142.7,-52.7C169.1,-37.2,184.5,-4.2,171,17.9C157.5,40.1,115,51.5,89.6,73.6C64.1,95.6,55.7,128.4,36.3,142.9C16.9,157.4,-13.5,153.5,-42.7,145.1C-71.9,136.7,-99.8,123.7,-106.2,100.7C-112.5,77.7,-97.3,44.8,-110.5,10.6C-123.6,-23.6,-165,-58.9,-167.2,-85.6C-169.4,-112.2,-132.3,-130.1,-97.8,-134.1C-63.4,-138,-31.7,-128,-9,-114C13.7,-100,27.4,-82,53,-74Z'
      }
    ]

    // hue shift angles
    const hues = [143, 320, 0]

    setAnimating(true)

    // update random hue shift
    setCurrentHue(hues[Math.floor(Math.random() * hues.length)])

    // animate blog to random shape
    anime({
      targets: '.blob path',
      d: shapes[Math.floor(Math.random() * shapes.length)],
      easing: 'linear',
      duration: 500,
      direction: 'alternate',
      complete: () => {
        setAnimating(false)
      }
    })
  }

  return (
    <Page onClick={() => play()}>
      <Video
        playsInline
        loop
        preload="true"
        className="video"
        muted
        src="/static/bg.mp4"
        type="video/mp4"
        ref={video}
        currentHue={currentHue}
        opacity={playing ? 1 : 0}
      />
      <div style={{ height: '100vh' }}>
        <Intro display={playing ? 'none' : 'block'}>
          {loading ? 'Loading...' : 'Tap to start'}
        </Intro>
        <Blob className="blob">
          <g transform="translate(300,300)">
            <path d="M83.5,-128.6C104.3,-116.6,114.4,-86.7,130.6,-57.8C146.8,-28.8,168.9,-0.7,176.2,33.2C183.5,67,176,106.5,155.7,141.3C135.5,176,102.4,206,67.5,204.9C32.6,203.7,-4.1,171.4,-43.6,156.3C-83.2,141.2,-125.5,143.3,-162.4,126.4C-199.3,109.5,-230.8,73.6,-244.8,30.2C-258.9,-13.2,-255.4,-64.1,-233.3,-104.1C-211.2,-144,-170.5,-173,-128.5,-175.3C-86.5,-177.6,-43.3,-153.3,-5.9,-144C31.4,-134.8,62.7,-140.6,83.5,-128.6Z" />
          </g>
        </Blob>
        <Letter
          left="-100"
          opacity={playing ? 1 : 0}
          translateX={rotation.beta * 20}>
          S
        </Letter>
        <Letter
          left="100"
          opacity={playing ? 1 : 0}
          translateX={rotation.beta * -25}>
          O
        </Letter>
        <Letter
          left="-100"
          opacity={playing ? 1 : 0}
          translateX={rotation.beta * 10}>
          U
        </Letter>
        <Letter
          left="100"
          opacity={playing ? 1 : 0}
          translateX={rotation.beta * -20}>
          L
        </Letter>
      </div>
    </Page>
  )
}

export default Home
