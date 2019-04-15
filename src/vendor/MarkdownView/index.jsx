/**
 * @description Markdown组件
 * @author kygeng
 * date: 2018-06-08
 */
import React from 'react';
import Remarkable from 'remarkable';
import hljs from 'highlight.js';
import PropTypes from 'prop-types';
import './atom-one-light.scss';
import './style.scss';

const md = new Remarkable('full', {
  html: true, // Enable HTML tags in source
  xhtmlOut: false, // Use '/' to close single tags (<br />)
  breaks: false, // Convert '\n' in paragraphs into <br>
  langPrefix: 'hljs language-', // CSS language prefix for fenced blocks
  linkify: true, // autoconvert URL-like texts to links
  linkTarget: '', // set target to open link in

  // Enable some language-neutral replacements + quotes beautification
  typographer: false,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
  quotes: '“”‘’',

  // options below are for demo only
  _highlight: true,
  _strict: false,
  _view: 'html', // html / src / debug

  // Highlighter function. Should return escaped HTML,
  // or '' if input not changed
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (__) {}

    return ''; // use external default escaping
  },
});

export default class MarkdownView extends React.Component {
  static defaultProps = {
    content: '',
  };

  static propTypes = {
    content: PropTypes.string,
  };

  render () {
    const HTML = {
      __html: md.render(this.props.content),
    };
    return (
      <React.Fragment>
        <div
          className="abc-wdcp-markdown-view"
          dangerouslySetInnerHTML={HTML}
        />
      </React.Fragment>
    );
  }
}
