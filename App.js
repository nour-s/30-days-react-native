/**
 * Day 1
 * A stop watch
 */
import React, { useState, useEffect, memo, useRef } from 'react';
import { Platform, FlatList, StyleSheet, StatusBar, Text, TouchableHighlight, View } from 'react-native';
import Util from './utils';
import { produce } from 'immer';

const WatchFace = ({ sectionTime, totalTime }) => (
	<View style={styles.watchFaceContainer}>
		<Text style={styles.sectionTime}>{sectionTime}</Text>
		<Text style={styles.totalTime}>{totalTime}</Text>
	</View>
)

const WatchControl = ({ stopWatch, clearRecord, startWatch, addRecord }) => {
	const [watchOn, setWatchOn] = useState(false);

	const _startWatch = () => {
		if (!watchOn) {
			startWatch()
			setWatchOn(true);
		} else {
			stopWatch()
			setWatchOn(false);
		}
	}

	const _addRecord = () => watchOn ? addRecord() : clearRecord();

	return (
		<View style={styles.watchControlContainer}>
			<View style={{ flex: 1, alignItems: "flex-start" }}>
				<TouchableHighlight style={styles.btnStop} underlayColor="#eee" onPress={() => _addRecord()}>
					<Text style={styles.btnStopText}>{watchOn ? 'Lap' : 'Reset'}</Text>
				</TouchableHighlight>
			</View>
			<View style={{ flex: 1, alignItems: "flex-end" }}>
				<TouchableHighlight style={styles.btnStart} underlayColor="#eee" onPress={() => _startWatch()}>
					<Text style={[styles.btnStartText, { color: watchOn ? '#60B644' : '#ff0044' }]}>{watchOn ? 'Stop' : 'Start'}</Text>
				</TouchableHighlight>
			</View>
		</View>
	)

}

const WatchRow = memo(({ title, time }) =>
	< View style={styles.recordItem}>
		<Text style={styles.recordItemTitle}>{title}</Text>
		<View style={{ alignItems: "center" }}>
			<Text style={styles.recordItemTime}>{time}</Text>
		</View>
	</View>);

const WatchRecord = ({ record }) => (
	<FlatList
		style={styles.recordList}
		data={[...record]}
		extraData={record}
		renderItem={({ index, item: { title, time } }) => <WatchRow key={index} title={title} time={time} />}
	/>
);

export default () => {
	const [state, setState] = useState({
		stopWatch: false,
		resetWatch: true,
		intialTime: 0,
		currentTime: 0,
		recordTime: 0,
		timeAccumulation: 0,
		totalTime: "00:00.00",
		sectionTime: "00:00.00",
		recordCounter: 0,
		ticking: false,
		record: Array.from(new Array(7)).map(() => ({ title: "", time: "" })),
	});

	useEffect(() => {
		if (Platform.OS === "ios") {
			StatusBar.setBarStyle(0);
		}

		return () => {
			_stopWatch();
			_clearRecord();
		}
	}, [])

	const { ticking } = state;
	const intRef = useRef();
	useEffect(() => {
		if (ticking) {
			const inter = setInterval(
				() => {
					setState(prevState => {
						let milSecond, second, minute, countingTime, secmilSecond, secsecond, secminute, seccountingTime;
						countingTime = prevState.timeAccumulation + prevState.currentTime - prevState.initialTime;
						minute = Math.floor(countingTime / (60 * 1000));
						second = Math.floor((countingTime - 6000 * minute) / 1000);
						milSecond = Math.floor((countingTime % 1000) / 10);
						seccountingTime = countingTime - state.recordTime;
						secminute = Math.floor(seccountingTime / (60 * 1000));
						secsecond = Math.floor((seccountingTime - 6000 * secminute) / 1000);
						secmilSecond = Math.floor((seccountingTime % 1000) / 10);
						return {
							...prevState,
							totalTime: (minute < 10 ? "0" + minute : minute) + ":" + (second < 10 ? "0" + second : second) + "." + (milSecond < 10 ? "0" + milSecond : milSecond),
							sectionTime: (secminute < 10 ? "0" + secminute : secminute) + ":" + (secsecond < 10 ? "0" + secsecond : secsecond) + "." + (secmilSecond < 10 ? "0" + secmilSecond : secmilSecond),
							currentTime: (new Date()).getTime()
						};
					})
				}, 10);

			intRef.current = inter;
		} else {
			clearInterval(intRef.current)
			setState(prevState => {
				return {
					...prevState,
					timeAccumulation: prevState.timeAccumulation + prevState.currentTime - prevState.initialTime
				};
			});
		}
		return () => clearInterval(intRef.current);
	}, [ticking])

	const _startWatch = () => {
		if (state.resetWatch) {
			setState(prevState => ({
				...prevState,
				stopWatch: false,
				resetWatch: false,
				timeAccumulation: 0,
				initialTime: (new Date()).getTime()
			}));
		} else {
			setState(prevState => ({
				...prevState,
				stopWatch: false,
				initialTime: (new Date()).getTime()
			}));
		}
		setState(prevState => ({ ...prevState, ticking: true }));
	}

	const _stopWatch = () => {
		setState(prevState => ({
			...prevState,
			ticking: false,
			stopWatch: true
		}))
	}

	const _addRecord = () => {
		let { recordCounter, record } = state;
		recordCounter++;
		if (recordCounter < 8) {
			record.pop();
		}
		record.unshift({ title: "Lap " + recordCounter, time: state.sectionTime });
		setState(produce(draft => {
			draft.recordTime = state.timeAccumulation + state.currentTime - state.initialTime;
			draft.recordCounter = recordCounter;
			draft.record = record;
		}));
	}

	const _clearRecord = () => {
		setState(prevState => ({
			...prevState,
			stopWatch: false,
			resetWatch: true,
			intialTime: 0,
			currentTime: 0,
			recordTime: 0,
			timeAccumulation: 0,
			totalTime: "00:00.00",
			sectionTime: "00:00.00",
			recordCounter: 0,
			record: Array.from(new Array(7)).map(() => ({ title: "", time: "" })),
		}));
	}


	return (<View style={styles.watchContainer}>
		<WatchFace totalTime={state.totalTime} sectionTime={state.sectionTime}></WatchFace>
		<WatchControl addRecord={() => _addRecord()} clearRecord={() => _clearRecord()} startWatch={() => _startWatch()} stopWatch={() => _stopWatch()} />
		<WatchRecord record={state.record}></WatchRecord>
	</View>);

}

const styles = StyleSheet.create({
	watchContainer: {
		alignItems: "center",
		backgroundColor: "#f3f3f3",
		marginTop: 60,
	},
	watchFaceContainer: {
		width: Util.size.width,
		paddingTop: 50, paddingLeft: 30, paddingRight: 30, paddingBottom: 40,
		backgroundColor: "#fff",
		borderBottomWidth: 1, borderBottomColor: "#ddd",
		height: 170,
	},
	sectionTime: {
		fontSize: 20,
		fontWeight: "100",
		paddingRight: 30,
		color: "#555",
		position: "absolute",
		left: Util.size.width - 140,
		top: 30
	},
	totalTime: {
		fontSize: Util.size.width === 375 ? 70 : 60,
		fontWeight: "100",
		color: "#222",
		paddingLeft: 20
	},
	watchControlContainer: {
		width: Util.size.width,
		height: 100,
		flexDirection: "row",
		backgroundColor: '#f3f3f3',
		paddingTop: 30, paddingLeft: 60, paddingRight: 60, paddingBottom: 0,
	},
	btnStart: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center"
	},
	btnStop: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center"
	},
	btnStartText: {
		fontSize: 14,
		backgroundColor: "transparent"
	},
	btnStopText: {
		fontSize: 14,
		backgroundColor: "transparent",
		color: "#555"
	},
	recordList: {
		width: Util.size.width,
		height: Util.size.height - 300,
		paddingLeft: 15,
	},
	recordItem: {
		height: 40,
		borderBottomWidth: Util.pixel, borderBottomColor: "#bbb",
		paddingTop: 5, paddingLeft: 10, paddingRight: 10, paddingBottom: 5,
		flexDirection: "row",
		alignItems: "center"
	},
	recordItemTitle: {
		backgroundColor: "transparent",
		flex: 1,
		textAlign: "left",
		paddingLeft: 20,
		color: "#777"
	},
	recordItemTime: {
		backgroundColor: "transparent",
		flex: 1,
		textAlign: "right",
		paddingRight: 20,
		color: "#222"
	},
});