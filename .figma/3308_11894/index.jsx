import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.instance2}>
      <div className={styles.wrapper}>
        <p className={styles.text}>预算单元</p>
      </div>
      <div className={styles.instance}>
        <p className={styles.text2}>多选请换行/逗号分隔</p>
        <img src="../image/mqrhapyt-ndn2irt.svg" className={styles.down} />
      </div>
    </div>
  );
}

export default Component;
