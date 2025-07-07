import React, { useState } from 'react';
import {
  ANIMATION_CLASSES,
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
  ANIMATION_GUIDELINES,
  animations,
} from '../../lib/animations';
import { LAYOUT_CLASSES, spacing } from '../../lib/spacing';
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card';

/**
 * Micro-Animation Demo Component
 * Comprehensive showcase of all animation patterns and micro-interactions
 */
const MicroAnimationDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAsyncAction = async () => {
    setLoading(true);
    setSuccess(false);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));

    setLoading(false);
    setSuccess(true);

    // Reset success state after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div
      className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'
      data-oid='x29lgvk'
    >
      <div className={LAYOUT_CLASSES.DASHBOARD_CONTAINER} data-oid='qvh9wa4'>
        {/* Hero Section */}
        <div className={LAYOUT_CLASSES.HERO_CONTAINER} data-oid='la0byi.'>
          <h1
            className='text-4xl font-bold text-gray-900 mb-4'
            data-oid='4:l.e4m'
          >
            Micro-Animation System Demo
          </h1>
          <p
            className='text-lg text-gray-600 max-w-3xl mx-auto'
            data-oid='-b8wvtf'
          >
            Interactive showcase of subtle animations, hover effects, and
            micro-interactions designed for modern SaaS applications.
          </p>
        </div>

        {/* Animation Guidelines */}
        <section
          className={spacing.getSectionSpacing('high')}
          data-oid='uj:cehz'
        >
          <Card
            variant='glass'
            size='lg'
            enterAnimation='fade'
            data-oid='yfi2znq'
          >
            <CardHeader data-oid='eu6viw6'>
              <CardTitle data-oid='ljheq1.'>
                Animation Design Principles
              </CardTitle>
              <CardDescription data-oid='tln.4ev'>
                Core principles guiding our micro-animation system for enhanced
                usability
              </CardDescription>
            </CardHeader>
            <CardContent data-oid='6wzi.5k'>
              <div
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                data-oid='uo0ona.'
              >
                {ANIMATION_GUIDELINES.PRINCIPLES.map((principle, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${animations.getEntranceAnimation('up')}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    data-oid='8x1e.58'
                  >
                    <div
                      className='flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2'
                      data-oid='e7q5sm.'
                    ></div>
                    <p className='text-sm text-gray-700' data-oid=':cr.0ht'>
                      {principle}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Hover Effects Showcase */}
        <section
          className={spacing.getSectionSpacing('medium')}
          data-oid='4clxlpk'
        >
          <h2
            className='text-2xl font-bold text-gray-900 mb-6 text-center'
            data-oid='uua9pjy'
          >
            Hover Effects & Interactions
          </h2>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${spacing.getGridSpacing('metrics')}`}
            data-oid='z47tg55'
          >
            {/* Card Hover */}
            <Card
              variant='basic'
              size='md'
              hoverAnimation='card'
              enterAnimation='up'
              data-oid='-vrny8a'
            >
              <CardContent data-oid='qthx6jr'>
                <h3
                  className='font-semibold text-gray-900 mb-2'
                  data-oid='lahjwxt'
                >
                  Card Hover
                </h3>
                <p className='text-sm text-gray-600 mb-4' data-oid='d3xzrh_'>
                  Subtle lift with shadow enhancement
                </p>
                <div
                  className='text-xs text-blue-600 font-medium'
                  data-oid='ksbj7qn'
                >
                  hover:-translate-y-1 + shadow-lg
                </div>
              </CardContent>
            </Card>

            {/* Button Hover */}
            <Card
              variant='elevated'
              size='md'
              hoverAnimation='button'
              enterAnimation='up'
              style={{ animationDelay: '100ms' }}
              data-oid='_brkk-.'
            >
              <CardContent data-oid='x1dyiih'>
                <h3
                  className='font-semibold text-gray-900 mb-2'
                  data-oid='bbeg_qd'
                >
                  Button Hover
                </h3>
                <p className='text-sm text-gray-600 mb-4' data-oid='ue7dz6d'>
                  Subtle scale with shadow
                </p>
                <div
                  className='text-xs text-green-600 font-medium'
                  data-oid='btx8zqb'
                >
                  hover:scale-[1.02] + shadow-md
                </div>
              </CardContent>
            </Card>

            {/* Metric Hover */}
            <Card
              variant='interactive'
              size='md'
              hoverAnimation='metric'
              enterAnimation='up'
              style={{ animationDelay: '200ms' }}
              data-oid='rx5cjpx'
            >
              <CardContent data-oid='qug4ivo'>
                <h3
                  className='font-semibold text-gray-900 mb-2'
                  data-oid='0s6_255'
                >
                  Metric Hover
                </h3>
                <p className='text-sm text-gray-600 mb-4' data-oid='.e3-f_g'>
                  Gentle lift for data display
                </p>
                <div
                  className='text-xs text-purple-600 font-medium'
                  data-oid='nbuc.9i'
                >
                  hover:-translate-y-0.5 + shadow-md
                </div>
              </CardContent>
            </Card>

            {/* Glass Hover */}
            <Card
              variant='glass'
              size='md'
              hoverAnimation='interactive'
              enterAnimation='up'
              style={{ animationDelay: '300ms' }}
              data-oid='xx5u4_x'
            >
              <CardContent data-oid='x3q9uf1'>
                <h3
                  className='font-semibold text-gray-900 mb-2'
                  data-oid='4msaxjb'
                >
                  Glass Hover
                </h3>
                <p className='text-sm text-gray-600 mb-4' data-oid='h7302gr'>
                  Enhanced glassmorphism effect
                </p>
                <div
                  className='text-xs text-indigo-600 font-medium'
                  data-oid='teoq06j'
                >
                  hover:backdrop-blur-md + bg-white/70
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Buttons Showcase */}
        <section
          className={spacing.getSectionSpacing('medium')}
          data-oid='y2njhr5'
        >
          <h2
            className='text-2xl font-bold text-gray-900 mb-6 text-center'
            data-oid='i9n4.dh'
          >
            Interactive Elements
          </h2>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 ${spacing.getGridSpacing('general')}`}
            data-oid='s4:8lr7'
          >
            {/* Primary Button */}
            <Card
              variant='basic'
              size='lg'
              enterAnimation='left'
              data-oid='y78momc'
            >
              <CardHeader data-oid='p8shbg_'>
                <CardTitle data-oid='mhf7yiz'>Primary Actions</CardTitle>
                <CardDescription data-oid='og3:vjp'>
                  Main call-to-action buttons with emphasis
                </CardDescription>
              </CardHeader>
              <CardContent data-oid='nec1q2b'>
                <div className='space-y-4' data-oid='ba8ofs.'>
                  <button
                    className={`w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium ${ANIMATION_CLASSES.HOVER.BUTTON_HOVER} ${ANIMATION_CLASSES.ACTIVE.BUTTON_PRESS} ${ANIMATION_CLASSES.FOCUS.RING_BLUE}`}
                    data-oid='6d4yygn'
                  >
                    Primary Button
                  </button>
                  <button
                    className={`w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium ${ANIMATION_CLASSES.HOVER.SCALE_SUBTLE} ${ANIMATION_CLASSES.ACTIVE.PRESS_SUBTLE} focus:ring-2 focus:ring-green-500 transition-all duration-200`}
                    data-oid='1fksru0'
                  >
                    Success Button
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Loading States */}
            <Card
              variant='elevated'
              size='lg'
              enterAnimation='up'
              data-oid='ipv6.3u'
            >
              <CardHeader data-oid='eo27gyh'>
                <CardTitle data-oid='kxviii8'>Loading States</CardTitle>
                <CardDescription data-oid='.454d1e'>
                  Animated feedback for async operations
                </CardDescription>
              </CardHeader>
              <CardContent data-oid='h_c2msj'>
                <div className='space-y-4' data-oid='rgf-dc0'>
                  <button
                    onClick={handleAsyncAction}
                    disabled={loading}
                    className={`w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 ${!loading ? ANIMATION_CLASSES.HOVER.BUTTON_HOVER : ''} ${ANIMATION_CLASSES.ACTIVE.BUTTON_PRESS} transition-all duration-200`}
                    data-oid='ulqleqr'
                  >
                    {loading ? (
                      <div
                        className='flex items-center justify-center space-x-2'
                        data-oid='7lanbl0'
                      >
                        <div
                          className={ANIMATION_CLASSES.LOADING.SPIN}
                          data-oid='.y5nklw'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            viewBox='0 0 24 24'
                            data-oid='wj8yq7y'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                              data-oid=':2n2wba'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              data-oid='vuegj8j'
                            ></path>
                          </svg>
                        </div>
                        <span data-oid='vbxf7:a'>Loading...</span>
                      </div>
                    ) : success ? (
                      <div
                        className='flex items-center justify-center space-x-2'
                        data-oid='gzve:d5'
                      >
                        <div
                          className={animations.getEntranceAnimation('scale')}
                          data-oid='-u9t7ue'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            data-oid='i2q7m69'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 13l4 4L19 7'
                              data-oid='5ehuuqb'
                            />
                          </svg>
                        </div>
                        <span data-oid='1e4z6r.'>Success!</span>
                      </div>
                    ) : (
                      'Start Loading'
                    )}
                  </button>

                  {/* Shimmer Loading Example */}
                  <div className='space-y-2' data-oid='60pbff-'>
                    <div
                      className='text-xs text-gray-600 mb-2'
                      data-oid='v3ps7-_'
                    >
                      Shimmer Loading:
                    </div>
                    <div
                      className={`h-4 rounded ${ANIMATION_CLASSES.LOADING.SHIMMER}`}
                      data-oid='h9.lzz:'
                    ></div>
                    <div
                      className={`h-4 rounded ${ANIMATION_CLASSES.LOADING.SHIMMER} w-3/4`}
                      data-oid='r-0bdfv'
                    ></div>
                    <div
                      className={`h-4 rounded ${ANIMATION_CLASSES.LOADING.SHIMMER} w-1/2`}
                      data-oid='hfq.37j'
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Focus & Accessibility */}
            <Card
              variant='glass'
              size='lg'
              enterAnimation='right'
              data-oid='ydm8d_u'
            >
              <CardHeader data-oid='kbcwyv.'>
                <CardTitle data-oid='p7zhpzg'>Focus & Accessibility</CardTitle>
                <CardDescription data-oid='himggo0'>
                  Keyboard navigation with visual feedback
                </CardDescription>
              </CardHeader>
              <CardContent data-oid='9qg715q'>
                <div className='space-y-4' data-oid='xf083iu'>
                  <button
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${ANIMATION_CLASSES.HOVER.LIFT_SUBTLE} ${ANIMATION_CLASSES.FOCUS.RING_BLUE} transition-all duration-200`}
                    data-oid='pys35r_'
                  >
                    Standard Focus
                  </button>
                  <button
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${ANIMATION_CLASSES.HOVER.LIFT_SUBTLE} ${ANIMATION_CLASSES.FOCUS.RING_SUBTLE} transition-all duration-200`}
                    data-oid='a--28dh'
                  >
                    Subtle Focus
                  </button>
                  <button
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${ANIMATION_CLASSES.HOVER.LIFT_SUBTLE} ${ANIMATION_CLASSES.FOCUS.RING_GLOW} transition-all duration-200`}
                    data-oid='zfezlvg'
                  >
                    Prominent Focus
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Timing & Easing Demo */}
        <section
          className={spacing.getSectionSpacing('medium')}
          data-oid='.npgre1'
        >
          <h2
            className='text-2xl font-bold text-gray-900 mb-6 text-center'
            data-oid='rtho54o'
          >
            Animation Timing & Easing
          </h2>

          <div
            className={`grid grid-cols-1 lg:grid-cols-2 ${spacing.getGridSpacing('charts')}`}
            data-oid='2nqc5d:'
          >
            {/* Timing Examples */}
            <Card
              variant='basic'
              size='lg'
              enterAnimation='left'
              data-oid='768ldjy'
            >
              <CardHeader data-oid='b-xpx7.'>
                <CardTitle data-oid='t_p-eur'>Animation Durations</CardTitle>
                <CardDescription data-oid='697nfy7'>
                  Different timing for various interaction types
                </CardDescription>
              </CardHeader>
              <CardContent data-oid='j9a.shq'>
                <div className='space-y-4' data-oid='2dp22kz'>
                  {Object.entries(ANIMATION_DURATIONS).map(
                    ([key, duration]) => (
                      <div
                        key={key}
                        className='flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                        style={{ transitionDuration: duration }}
                        data-oid='2wh2xts'
                      >
                        <span
                          className='font-medium text-gray-900'
                          data-oid='_naue7k'
                        >
                          {key}
                        </span>
                        <span
                          className='text-sm text-gray-600'
                          data-oid='37lpzg4'
                        >
                          {duration}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Easing Examples */}
            <Card
              variant='elevated'
              size='lg'
              enterAnimation='right'
              data-oid='tulfubr'
            >
              <CardHeader data-oid='bsy8am.'>
                <CardTitle data-oid='.jc0d71'>Easing Functions</CardTitle>
                <CardDescription data-oid=':qim93f'>
                  Natural motion curves for smooth animations
                </CardDescription>
              </CardHeader>
              <CardContent data-oid='llybqc3'>
                <div className='space-y-4' data-oid='06d204-'>
                  {Object.entries(ANIMATION_EASINGS).map(([key, easing]) => (
                    <div
                      key={key}
                      className='flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:scale-105 transition-transform duration-300'
                      style={{ transitionTimingFunction: easing }}
                      data-oid='68clsrz'
                    >
                      <span
                        className='font-medium text-gray-900'
                        data-oid='ec5e595'
                      >
                        {key}
                      </span>
                      <span
                        className='text-xs text-gray-600 font-mono'
                        data-oid='10j2rd4'
                      >
                        {easing}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Best Practices */}
        <section
          className={spacing.getSectionSpacing('medium')}
          data-oid='5edzsjj'
        >
          <Card
            variant='glass'
            size='lg'
            enterAnimation='up'
            data-oid='q2q2-ky'
          >
            <CardHeader data-oid='v-wxqi4'>
              <CardTitle data-oid='p56a5qw'>Animation Best Practices</CardTitle>
              <CardDescription data-oid='2ds3asd'>
                Guidelines for implementing effective micro-animations in your
                applications
              </CardDescription>
            </CardHeader>
            <CardContent data-oid='y2udbf8'>
              <div
                className='grid grid-cols-1 md:grid-cols-2 gap-8'
                data-oid='-zmxqop'
              >
                {/* Do's */}
                <div data-oid='1kys2g8'>
                  <h3
                    className='text-lg font-semibold text-green-600 mb-4 flex items-center'
                    data-oid='w25nr9o'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      data-oid='o7ztbuh'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                        data-oid='-j4_3v7'
                      />
                    </svg>
                    Do's
                  </h3>
                  <ul className='space-y-3' data-oid='dc25hx.'>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='9qu05hf'
                    >
                      <span
                        className='text-green-600 font-bold'
                        data-oid='-p0y904'
                      >
                        ✓
                      </span>
                      <span className='text-sm' data-oid='l:oanxv'>
                        Use 200-300ms for hover states
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='10oc:g5'
                    >
                      <span
                        className='text-green-600 font-bold'
                        data-oid='9usj598'
                      >
                        ✓
                      </span>
                      <span className='text-sm' data-oid='ju5dzyn'>
                        Provide immediate visual feedback
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='xj7o3cu'
                    >
                      <span
                        className='text-green-600 font-bold'
                        data-oid='r0fk16t'
                      >
                        ✓
                      </span>
                      <span className='text-sm' data-oid='10i_:d7'>
                        Use ease-out for entrances
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='xm7bjkn'
                    >
                      <span
                        className='text-green-600 font-bold'
                        data-oid='v372e8f'
                      >
                        ✓
                      </span>
                      <span className='text-sm' data-oid='mgif4nj'>
                        Respect prefers-reduced-motion
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='hfyzg23'
                    >
                      <span
                        className='text-green-600 font-bold'
                        data-oid='5tm--5r'
                      >
                        ✓
                      </span>
                      <span className='text-sm' data-oid='vu1mo58'>
                        Keep animations subtle (2-4px)
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Don'ts */}
                <div data-oid='23xmcuw'>
                  <h3
                    className='text-lg font-semibold text-red-600 mb-4 flex items-center'
                    data-oid='8j5c:6q'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      data-oid='88ab1s5'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                        data-oid=':-2i9sk'
                      />
                    </svg>
                    Don'ts
                  </h3>
                  <ul className='space-y-3' data-oid='jf2c80v'>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='1b9f9vr'
                    >
                      <span
                        className='text-red-600 font-bold'
                        data-oid='hrqgwrh'
                      >
                        ✗
                      </span>
                      <span className='text-sm' data-oid='by-v-p2'>
                        Use overly long durations (&gt;500ms)
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='gtm6_70'
                    >
                      <span
                        className='text-red-600 font-bold'
                        data-oid='c-dq-px'
                      >
                        ✗
                      </span>
                      <span className='text-sm' data-oid='2gdmpgt'>
                        Animate too many properties at once
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='fllfslt'
                    >
                      <span
                        className='text-red-600 font-bold'
                        data-oid='.pmoo-e'
                      >
                        ✗
                      </span>
                      <span className='text-sm' data-oid='41cb3nt'>
                        Use jarring or bouncy animations
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='imsm9iy'
                    >
                      <span
                        className='text-red-600 font-bold'
                        data-oid='-vfod.b'
                      >
                        ✗
                      </span>
                      <span className='text-sm' data-oid='wb5ur2m'>
                        Animate on every interaction
                      </span>
                    </li>
                    <li
                      className='flex items-start space-x-3'
                      data-oid='phqx3:y'
                    >
                      <span
                        className='text-red-600 font-bold'
                        data-oid='7_u2ou6'
                      >
                        ✗
                      </span>
                      <span className='text-sm' data-oid='.ho:3u2'>
                        Ignore accessibility preferences
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default MicroAnimationDemo;
