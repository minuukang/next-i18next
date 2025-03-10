import React from 'react'
import fs from 'fs'
import { screen, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import getConfig from 'next/config'
import { applyClientHMR } from 'i18next-hmr/client'

import { appWithTranslation } from './appWithTranslation'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
}))

const DummyI18nextProvider: React.FC = ({ children }) => (
  <>{children}</>
)

jest.mock('react-i18next', () => ({
  I18nextProvider: jest.fn(),
  __esmodule: true,
}))

jest.mock('next/config')
jest.mock('i18next-hmr/client', () => ({
  applyClientHMR: jest.fn(),
}))

jest.mock('i18next-http-backend', () => ({
  __esmodule: false,
  default: jest.requireActual('i18next-http-backend'),
}))


const DummyApp = appWithTranslation(() => (
  <div>Hello world</div>
))

const props = {
  pageProps: {
    _nextI18Next: {
      initialLocale: 'en',
      userConfig: {
        i18n: {
          defaultLocale: 'en',
          locales: ['en', 'de'],
        },
      },
    },
  } as any,
} as any

const renderComponent = () =>
  render(
    <DummyApp
      {...props}
    />
  )

describe('appWithTranslation', () => {
  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
    (I18nextProvider as jest.Mock).mockImplementation(DummyI18nextProvider);
    (getConfig as jest.Mock).mockReturnValue({
      publicRuntimeConfig: {},
    })
  })
  afterEach(jest.resetAllMocks)

  it('returns children', () => {
    renderComponent()
    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  it('respects configOverride', () => {
    const DummyAppConfigOverride = appWithTranslation(() => (
      <div>Hello world</div>
    ), {
      configOverride: 'custom-value',
      i18n: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
      },
    } as any)
    const customProps = {
      pageProps: {
        _nextI18Next: {
          initialLocale: 'en',
        },
      } as any,
    } as any
    render(
      <DummyAppConfigOverride
        {...customProps}
      />
    )
    const [args] = (I18nextProvider as jest.Mock).mock.calls

    expect(screen.getByText('Hello world')).toBeTruthy()
    expect(args[0].i18n.options.configOverride).toBe('custom-value')
  })

  it('throws an error if userConfig and configOverride are both missing', () => {
    const DummyAppConfigOverride = appWithTranslation(() => (
      <div>Hello world</div>
    ))
    const customProps = {
      pageProps: {
        _nextI18Next: {
          initialLocale: 'en',
          userConfig: null,
        },
      } as any,
    } as any
    expect(
      () => render(
        <DummyAppConfigOverride
          {...customProps}
        />
      )
    ).toThrow('appWithTranslation was called without a next-i18next config')
  })

  it('returns an I18nextProvider', () => {
    renderComponent()
    expect(I18nextProvider).toHaveBeenCalledTimes(1)

    const [args] = (I18nextProvider as jest.Mock).mock.calls

    expect(I18nextProvider).toHaveBeenCalledTimes(1)
    expect(args).toHaveLength(2)
    expect(args[0].children).toBeTruthy()
    expect(args[0].i18n.addResource).toBeTruthy()
    expect(args[0].i18n.language).toEqual('en')
    expect(args[0].i18n.isInitialized).toEqual(true)

    expect(fs.existsSync).toHaveBeenCalledTimes(0)
    expect(fs.readdirSync).toHaveBeenCalledTimes(0)
  })

  describe('When next publicRuntimeConfig.__HMR_I18N_ENABLED__ is enabled', () => {
    beforeEach(() => {
      (getConfig as jest.Mock).mockReturnValue({
        publicRuntimeConfig: {
          __HMR_I18N_ENABLED__: true,
          __HMR_I18N_NAMESPACES__: ['foo', 'bar'],
        },
      })
    })

    it('applyClientHMR should be called', () => {
      renderComponent()
      expect(applyClientHMR).toHaveBeenCalled()
    })

    it('i18n.options.ns should be set from publicRuntimeConfig.__HMR_I18N_NAMESPACES__', () => {
      renderComponent()

      const [args] = (I18nextProvider as jest.Mock).mock.calls
      expect(args[0].i18n.options.ns).toEqual(['foo', 'bar'])
    })
  })

})
