import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.frame3}>
      <div className={styles.frame1912054060}>
        <div className={styles.frame1912054056}>
          <p className={styles.text}>仅看一级预算单元</p>
          <div className={styles.instance}>
            <div className={styles.ellipse} />
          </div>
        </div>
        <div className={styles.frame1912054057}>
          <p className={styles.text}>仅看我有权限的</p>
          <div className={styles.instance}>
            <div className={styles.ellipse} />
          </div>
        </div>
      </div>
      <div className={styles.frame1912054058}>
        <div className={styles.frame1912054054}>
          <div className={styles.frame1410097688}>
            <div className={styles.instance2}>
              <div className={styles.frame} />
            </div>
            <p className={styles.text2}>全部选择：0 项</p>
          </div>
          <div className={styles.frame1912053948}>
            <img src="../image/mqrwc0p7-p4iipgp.svg" className={styles.frame2} />
            <p className={styles.text3}>暂未匹配到相关预算单元</p>
          </div>
        </div>
        <div className={styles.frame1410098002}>
          <div className={styles.checkbox}>
            <p className={styles.text6}>
              <span className={styles.text4}>已选择</span>
              <span className={styles.text5}>：0 项</span>
            </p>
            <div className={styles.icDelete}>
              <img src="../image/mqrwc0p7-q7ivf42.svg" className={styles.delete} />
            </div>
          </div>
          <div className={styles.frame19120539482}>
            <img src="../image/mqrwc0p7-t0iqtby.svg" className={styles.frame2} />
            <p className={styles.text3}>暂未选择预算单元</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
